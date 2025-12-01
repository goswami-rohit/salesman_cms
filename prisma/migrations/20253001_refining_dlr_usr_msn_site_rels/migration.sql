ALTER TABLE technical_sites 
DROP COLUMN related_dealer_id,
DROP COLUMN related_mason_pc_id;

ALTER TABLE dealers
DROP COLUMN site_id

ALTER TABLE users
DROP COLUMN site_id

ALTER TABLE mason_pc_side
DROP COLUMN site_id