import crypto from 'crypto';

export interface MidtransTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName: string;
    email: string;
    phone?: string;
  };
  itemDetails: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export class MidtransService {
  private serverKey: string;
  private isProduction: boolean;
  private snapUrl: string;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    this.snapUrl = this.isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
  }

  isConfigured(): boolean {
    return Boolean(this.serverKey && this.serverKey.trim() !== '' && !this.serverKey.includes('dummy'));
  }

  /**
   * Verify Midtrans notification signature
   * signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
   */
  verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    incomingSignature: string
  ): boolean {
    if (!this.serverKey) return false;
    const raw = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    const computedSignature = crypto.createHash('sha512').update(raw).digest('hex');
    return computedSignature === incomingSignature;
  }

  /**
   * Create Snap Transaction Token from Server
   */
  async createTransaction(params: MidtransTransactionParams): Promise<MidtransSnapResponse> {
    if (!this.isConfigured()) {
      // In development / demo when Midtrans keys are pending, return simulated transaction
      return {
        token: `simulated_snap_token_${Date.now()}`,
        redirect_url: `/dashboard/settings?simulated_payment=success&order_id=${params.orderId}`,
      };
    }

    const authHeader = Buffer.from(`${this.serverKey}:`).toString('base64');

    const response = await fetch(this.snapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: params.orderId,
          gross_amount: params.grossAmount,
        },
        customer_details: {
          first_name: params.customerDetails.firstName,
          email: params.customerDetails.email,
          phone: params.customerDetails.phone,
        },
        item_details: params.itemDetails,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Midtrans API Error (${response.status}): ${errText}`);
    }

    return (await response.json()) as MidtransSnapResponse;
  }
}

export const midtransService = new MidtransService();
