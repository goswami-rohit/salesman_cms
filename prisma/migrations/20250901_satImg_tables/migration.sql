CREATE TABLE aoi (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL UNIQUE,         -- 'Golaghat', 'Jorhat', etc.
  type             TEXT NOT NULL,                -- 'district', 'belt', 'custom'
  center_lat       DOUBLE PRECISION NOT NULL,
  center_lon       DOUBLE PRECISION NOT NULL,
  radius_km        DOUBLE PRECISION NOT NULL,    -- temporary until you add full polygons
  boundary_geojson JSONB,                        -- optional, later

  created_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE aoi_grid_cell (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aoi_id           UUID NOT NULL REFERENCES aoi(id) ON DELETE CASCADE,

  cell_row         INTEGER NOT NULL,
  cell_col         INTEGER NOT NULL,
  centroid_lat     DOUBLE PRECISION NOT NULL,
  centroid_lon     DOUBLE PRECISION NOT NULL,
  geometry_geojson JSONB NOT NULL,        -- polygon of the 100m cell

  created_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  UNIQUE (aoi_id, cell_row, cell_col)
);

CREATE INDEX idx_aoi_grid_cell_aoi ON aoi_grid_cell (aoi_id);

CREATE TABLE satellite_scene (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aoi_id                UUID NOT NULL REFERENCES aoi(id) ON DELETE CASCADE,

  provider              TEXT NOT NULL,          -- 'sentinel-2'
  stac_id               TEXT NOT NULL,          -- STAC item id
  stac_collection       TEXT NOT NULL,          -- e.g. 'sentinel-2-l2a'
  acquisition_datetime  TIMESTAMPTZ(6) NOT NULL,
  cloud_cover_percent   DOUBLE PRECISION,

  bbox_min_lon          DOUBLE PRECISION NOT NULL,
  bbox_min_lat          DOUBLE PRECISION NOT NULL,
  bbox_max_lon          DOUBLE PRECISION NOT NULL,
  bbox_max_lat          DOUBLE PRECISION NOT NULL,

  crs_epsg              INTEGER,
  native_resolution_m   DOUBLE PRECISION,       -- 10.0 for B02/B03/B04/B08

  r2_bucket             TEXT NOT NULL,          -- your R2 bucket name
  r2_prefix             TEXT NOT NULL,          -- 'sentinel/golaghat/2025-12-09'
  red_band_key          TEXT NOT NULL,          -- B04 .tif key
  nir_band_key          TEXT NOT NULL,          -- B08 .tif key
  green_band_key        TEXT,                   -- B03
  blue_band_key         TEXT,                   -- B02
  rgb_preview_key       TEXT,                   -- optional PNG/JPEG

  stac_properties       JSONB,                  -- raw properties if you want
  stac_assets           JSONB,                  -- raw assets map

  is_downloaded         BOOLEAN NOT NULL DEFAULT FALSE,
  is_processed          BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted_from_r2    BOOLEAN NOT NULL DEFAULT FALSE,

  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX idx_sat_scene_aoi_time
  ON satellite_scene (aoi_id, acquisition_datetime);

CREATE TABLE grid_change_score (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  aoi_id                   UUID NOT NULL REFERENCES aoi(id) ON DELETE CASCADE,
  grid_cell_id             UUID NOT NULL REFERENCES aoi_grid_cell(id) ON DELETE CASCADE,

  earlier_scene_id         UUID NOT NULL REFERENCES satellite_scene(id),
  later_scene_id           UUID NOT NULL REFERENCES satellite_scene(id),

  t0_acquisition_datetime  TIMESTAMPTZ(6) NOT NULL,
  t1_acquisition_datetime  TIMESTAMPTZ(6) NOT NULL,

  ndvi_drop_mean           DOUBLE PRECISION,      -- avg NDVI(t1 - t0) in cell
  ndvi_drop_fraction       DOUBLE PRECISION,      -- fraction of pixels past threshold
  change_score             DOUBLE PRECISION,      -- your combined scalar
  is_hot                   BOOLEAN NOT NULL DEFAULT FALSE,

  created_at               TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX idx_grid_change_aoi_cell
  ON grid_change_score (aoi_id, grid_cell_id, t1_acquisition_datetime);

CREATE TABLE highres_scene (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  aoi_id                UUID NOT NULL REFERENCES aoi(id) ON DELETE CASCADE,
  grid_cell_id          UUID REFERENCES aoi_grid_cell(id) ON DELETE SET NULL,

  provider              TEXT NOT NULL,          -- 'planet', 'skyfi', 'maxar'
  acquisition_datetime  TIMESTAMPTZ(6) NOT NULL,
  resolution_m          DOUBLE PRECISION NOT NULL,

  bbox_min_lon          DOUBLE PRECISION NOT NULL,
  bbox_min_lat          DOUBLE PRECISION NOT NULL,
  bbox_max_lon          DOUBLE PRECISION NOT NULL,
  bbox_max_lat          DOUBLE PRECISION NOT NULL,

  r2_bucket             TEXT NOT NULL,
  r2_key                TEXT NOT NULL,          -- tile path in R2
  raw_metadata_json     JSONB,                  -- provider response

  is_downloaded         BOOLEAN NOT NULL DEFAULT FALSE,
  is_processed          BOOLEAN NOT NULL DEFAULT FALSE,

  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX idx_highres_aoi_time
  ON highres_scene (aoi_id, acquisition_datetime);

CREATE TABLE detected_building (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  highres_scene_id      UUID NOT NULL REFERENCES highres_scene(id) ON DELETE CASCADE,
  aoi_id                UUID NOT NULL REFERENCES aoi(id) ON DELETE CASCADE,
  grid_cell_id          UUID REFERENCES aoi_grid_cell(id) ON DELETE SET NULL,

  centroid_lat          DOUBLE PRECISION NOT NULL,
  centroid_lon          DOUBLE PRECISION NOT NULL,
  footprint_geojson     JSONB NOT NULL,
  area_sq_m             DOUBLE PRECISION NOT NULL,

  detection_confidence  DOUBLE PRECISION,        -- 0–1
  status                TEXT NOT NULL DEFAULT 'auto_detected',
                        -- 'auto_detected', 'promoted_to_site', 'discarded'

  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX idx_detected_building_aoi
  ON detected_building (aoi_id);

CREATE TABLE construction_site (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  aoi_id                UUID NOT NULL REFERENCES aoi(id) ON DELETE CASCADE,
  grid_cell_id          UUID REFERENCES aoi_grid_cell(id) ON DELETE SET NULL,

  source_type           TEXT NOT NULL,       -- 'sentinel_hotspot', 'highres_building', 'tso_manual'
  source_building_id    UUID REFERENCES detected_building(id) ON DELETE SET NULL,

  lat                   DOUBLE PRECISION NOT NULL,
  lon                   DOUBLE PRECISION NOT NULL,
  geom_geojson          JSONB,               -- polygon or buffered point
  estimated_area_sq_m   DOUBLE PRECISION,

  first_seen_date       DATE NOT NULL,
  last_seen_date        DATE NOT NULL,

  status                TEXT NOT NULL DEFAULT 'new',
                        -- 'new', 'in_progress', 'completed', 'dead'
  verified_by_tso_id    UUID,                -- FK to users.id in your existing table
  verified_at           TIMESTAMPTZ(6),

  linked_dealer_id      UUID,                -- FK to dealers.id if you want
  notes                 TEXT,

  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_aoi_status
  ON construction_site (aoi_id, status, first_seen_date);

CREATE TABLE tso_visit (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  site_id           UUID NOT NULL REFERENCES construction_site(id) ON DELETE CASCADE,
  tso_id            UUID NOT NULL,              -- link to your existing users table
  visited_at        TIMESTAMPTZ(6) NOT NULL,

  visit_outcome     TEXT NOT NULL,              -- 'not_found', 'under_construction', 'finished', etc.
  comments          TEXT,
  photo_urls        TEXT[],                     -- or separate photo table if you want

  created_at        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX idx_tso_visit_site
  ON tso_visit (site_id, visited_at);
