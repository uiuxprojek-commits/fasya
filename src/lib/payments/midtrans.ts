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
    
    // Auto-detect production mode:
    // If MIDTRANS_IS_PRODUCTION is set, respect it.
    // Otherwise check server key prefix: 'Mid-server-' is production, 'SB-' is sandbox.
    const envProd = process.env.MIDTRANS_IS_PRODUCTION;
    if (envProd !== undefined && envProd !== '') {
      this.isProduction = envProd === 'true';
    } else {
      this.isProduction = this.serverKey.startsWith('Mid-server-');
    }

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
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      'https://fasyatatadana.vercel.app';

    if (!this.isConfigured()) {
      // In development / demo when Midtrans keys are pending, return simulated transaction
      return {
        token: `simulated_snap_token_${Date.now()}`,
        redirect_url: `${appUrl}/dashboard/settings?simulated_payment=success&order_id=${params.orderId}`,
      };
    }

    const authHeader = Buffer.from(`${this.serverKey.trim()}:`).toString('base64');
    const grossAmountInt = Math.round(params.grossAmount);

    const payload = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: grossAmountInt,
      },
      customer_details: {
        first_name: params.customerDetails.firstName,
        email: params.customerDetails.email,
        phone: params.customerDetails.phone,
      },
      item_details: params.itemDetails.map((item) => ({
        id: item.id.slice(0, 50),
        price: Math.round(item.price),
        quantity: item.quantity,
        name: item.name.slice(0, 50),
      })),
      callbacks: {
        finish: `${appUrl}/dashboard/settings?payment=finish&order_id=${params.orderId}`,
      },
    };

    console.log('[Midtrans] Creating transaction:', {
      url: this.snapUrl,
      isProduction: this.isProduction,
      orderId: params.orderId,
      grossAmount: grossAmountInt,
    });

    const response = await fetch(this.snapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Midtrans] Create transaction failed (${response.status}):`, errText);
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error_messages ? jsonErr.error_messages.join(', ') : errText;
      } catch {}
      throw new Error(`Midtrans API (${response.status}): ${parsedErr}`);
    }

    return (await response.json()) as MidtransSnapResponse;
  }
}

export const midtransService = new MidtransService();
