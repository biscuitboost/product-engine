/**
 * Credit Manager
 * Handles all credit operations: deduct, refund, purchase
 * Uses PostgreSQL RPC functions for atomic operations
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

class CreditManager {
  /**
   * Get user's current credit balance
   */
  async getBalance(userId: string): Promise<number> {
    const supabase = createServerSupabaseClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    return user.credits;
  }

  /**
   * Deduct credits from user balance (atomic operation)
   * @param userId - User ID
   * @param amount - Number of credits to deduct
   * @param jobId - Related job ID for audit trail
   */
  async deduct(userId: string, amount: number, jobId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Use RPC function for atomic credit deduction
    const { error: rpcError } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (rpcError) {
      throw new Error(`Failed to deduct credits: ${rpcError.message}`);
    }

    // Log transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        transaction_type: 'usage',
        related_job_id: jobId,
      });

    if (transactionError) {
      console.error('Failed to log credit transaction:', transactionError);
      // Don't throw - credit was already deducted, logging is secondary
    }

    console.log(`[CreditManager] Deducted ${amount} credit(s) from user ${userId} for job ${jobId}`);
  }

  /**
   * Refund credits to user (when job fails)
   * @param userId - User ID
   * @param amount - Number of credits to refund
   * @param jobId - Related job ID for audit trail
   */
  async refund(userId: string, amount: number, jobId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Use RPC function for atomic credit addition
    const { error: rpcError } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (rpcError) {
      throw new Error(`Failed to refund credits: ${rpcError.message}`);
    }

    // Log transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: 'refund',
        related_job_id: jobId,
      });

    if (transactionError) {
      console.error('Failed to log credit transaction:', transactionError);
    }

    console.log(`[CreditManager] Refunded ${amount} credit(s) to user ${userId} for job ${jobId}`);
  }

  /**
   * Add credits to user (after purchase)
   * @param userId - User ID
   * @param amount - Number of credits to add
   * @param stripePaymentId - Stripe payment ID for audit trail
   */
  async purchase(userId: string, amount: number, stripePaymentId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Use RPC function for atomic credit addition
    const { error: rpcError } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (rpcError) {
      throw new Error(`Failed to add purchased credits: ${rpcError.message}`);
    }

    // Log transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: 'purchase',
        stripe_payment_id: stripePaymentId,
      });

    if (transactionError) {
      console.error('Failed to log credit transaction:', transactionError);
    }

    console.log(`[CreditManager] Added ${amount} purchased credit(s) to user ${userId}`);
  }

  /**
   * Check if user has sufficient credits
   * @param userId - User ID
   * @param required - Required number of credits
   * @returns true if user has enough credits
   */
  async hasCredits(userId: string, required: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= required;
  }

  /**
   * Get user's credit transaction history
   * @param userId - User ID
   * @param limit - Number of transactions to retrieve
   */
  async getTransactionHistory(userId: string, limit: number = 50) {
    const supabase = createServerSupabaseClient();

    const { data: transactions, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error('Failed to fetch transaction history');
    }

    return transactions;
  }
}

// Singleton instance
export const creditManager = new CreditManager();
