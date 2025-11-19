// src/lib/pointsCalcLogic.ts

export const LOYALTY_CONSTANTS = {
    BASE_POINTS_PER_BAG: 1,
    REFERRAL_BONUS_POINTS: 100,
    REFERRAL_BAG_THRESHOLD: 200, 

    BONANZA_ADDITIONAL_POINTS_PER_BAG: 3, // 4 Total - 1 Base = 3 Additional
    BONANZA_START_DATE: new Date('2025-11-15T00:00:00.000Z'),
    BONANZA_END_DATE: new Date('2026-01-15T23:59:59.999Z'), 

    // Joining Bonus: "250 points" (15th Nov to 31st Mar 2026)
    JOINING_BONUS_POINTS: 250,
    JOINING_BONUS_START_DATE: new Date('2025-11-15T00:00:00.000Z'),
    JOINING_BONUS_END_DATE: new Date('2026-03-31T23:59:59.999Z'), // New end date

    // Extra Points: "Every 250 bags = +500 points" (15th Nov to 31st Mar 2026)
    EXTRA_BONUS_BAG_SLAB: 250,
    EXTRA_BONUS_POINTS: 500,
    EXTRA_BONUS_START_DATE: new Date('2025-11-15T00:00:00.000Z'),
    EXTRA_BONUS_END_DATE: new Date('2026-03-31T23:59:59.999Z'), // New end date
};

// --- CORE CALCULATION FUNCTIONS ---

export function calculateJoiningBonusPoints(): number {
    const today = new Date();
    const isJoiningPeriod = 
        today >= LOYALTY_CONSTANTS.JOINING_BONUS_START_DATE && 
        today <= LOYALTY_CONSTANTS.JOINING_BONUS_END_DATE;

    return isJoiningPeriod ? LOYALTY_CONSTANTS.JOINING_BONUS_POINTS : 0;
}

export function calculateBaseAndBonanzaPoints(bagCount: number, purchaseDate: Date): number {
    // Always calculate Base Points: 1 Bag = 1 Point
    let points = bagCount * LOYALTY_CONSTANTS.BASE_POINTS_PER_BAG;

    // Bonanza check: 15th Nov to 15th Jan 2026
    const isBonanzaPeriod = 
        purchaseDate >= LOYALTY_CONSTANTS.BONANZA_START_DATE && 
        purchaseDate <= LOYALTY_CONSTANTS.BONANZA_END_DATE;
        
    if (isBonanzaPeriod) {
        // Add the additional points: 1 Bag = 4 Total, so we add 3 more points.
        points += bagCount * LOYALTY_CONSTANTS.BONANZA_ADDITIONAL_POINTS_PER_BAG;
    }
    
    return points;
}

export function calculateExtraBonusPoints(oldTotalBags: number, newBagCount: number, transactionDate: Date): number {
    const isExtraBonusPeriod =
        transactionDate >= LOYALTY_CONSTANTS.EXTRA_BONUS_START_DATE &&
        transactionDate <= LOYALTY_CONSTANTS.EXTRA_BONUS_END_DATE;

    if (!isExtraBonusPeriod) {
        return 0;
    }
    
    const newTotalBags = oldTotalBags + newBagCount;
    const slab = LOYALTY_CONSTANTS.EXTRA_BONUS_BAG_SLAB;
    
    // Calculate how many 250-bag slabs were completed BEFORE the new lift
    const oldSlabCount = Math.floor(oldTotalBags / slab);
    
    // Calculate how many 250-bag slabs are completed AFTER the new lift
    const newSlabCount = Math.floor(newTotalBags / slab);
    
    // The number of new slabs crossed is the difference
    const slabsCrossed = newSlabCount - oldSlabCount;

    if (slabsCrossed <= 0) {
        return 0;
    }

    // Each crossed slab awards 500 points
    return slabsCrossed * LOYALTY_CONSTANTS.EXTRA_BONUS_POINTS;
}

export function checkReferralBonusTrigger(oldTotalBags: number, newBagCount: number): number {
    const threshold = LOYALTY_CONSTANTS.REFERRAL_BAG_THRESHOLD; // 200 bags
    const newTotalBags = oldTotalBags + newBagCount;

    // Trigger only if the OLD total was below 200 AND the NEW total is >= 200
    const trigger = oldTotalBags < threshold && newTotalBags >= threshold;

    return trigger ? LOYALTY_CONSTANTS.REFERRAL_BONUS_POINTS : 0;
}

export function calculateRedemptionPoints(pointCost: number, quantity: number): number {
    if (pointCost <= 0 || quantity <= 0) {
        return 0;
    }
    // Redemption points are debited (negative value) from the Mason's balance.
    return - (pointCost * quantity);
}