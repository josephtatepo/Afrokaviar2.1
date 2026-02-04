import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    const stripe = await getUncachableStripeClient();
    let webhookSecret = await sync.getManagedWebhookSecret();
    
    if (!webhookSecret) {
      webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    }

    if (!webhookSecret) {
      const payloadString = payload.toString('utf8');
      try {
        const event = JSON.parse(payloadString);
        await WebhookHandlers.handleEvent(event);
      } catch (err: any) {
        console.error('Error parsing webhook event:', err.message);
      }
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      await WebhookHandlers.handleEvent(event);
    } catch (err: any) {
      console.error('Error handling custom event:', err.message);
    }
  }

  static async handleEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await WebhookHandlers.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await WebhookHandlers.handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await WebhookHandlers.handleSubscriptionDeleted(event.data.object);
        break;
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    const metadata = session.metadata || {};
    const userId = metadata.userId;
    const type = metadata.type;

    if (!userId) {
      console.log('No userId in checkout session metadata');
      return;
    }

    if (type === 'song_purchase') {
      const songId = metadata.songId;
      if (!songId) {
        console.log('No songId in checkout session metadata for song purchase');
        return;
      }

      const existingEntitlement = await storage.hasEntitlement(userId, songId);
      if (existingEntitlement) {
        console.log(`Entitlement already exists for user ${userId} and song ${songId}`);
        return;
      }

      const order = await storage.createOrder({
        userId,
        stripePaymentIntentId: session.payment_intent,
        status: 'completed',
        totalAmount: session.amount_total,
      });

      const song = await storage.getSongById(songId);
      if (song) {
        await storage.createOrderItem({
          orderId: order.id,
          songId,
          price: song.price,
        });
      }

      await storage.createEntitlement({
        userId,
        songId,
        orderId: order.id,
      });

      console.log(`Created entitlement for user ${userId} and song ${songId}`);
    } else if (type === 'library_subscription') {
      await storage.updateUserStripeInfo(userId, {
        stripeSubscriptionId: session.subscription,
      });
      console.log(`Updated subscription for user ${userId}`);
    }
  }

  static async handleSubscriptionUpdate(subscription: any): Promise<void> {
    const customerId = subscription.customer;
    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.retrieve(customerId);
    
    if ('deleted' in customer && customer.deleted) {
      return;
    }

    const userId = (customer as any).metadata?.userId;
    if (!userId) {
      console.log('No userId in customer metadata');
      return;
    }

    await storage.updateUserStripeInfo(userId, {
      stripeSubscriptionId: subscription.id,
    });
    console.log(`Updated subscription ${subscription.id} for user ${userId}`);
  }

  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const customerId = subscription.customer;
    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.retrieve(customerId);
    
    if ('deleted' in customer && customer.deleted) {
      return;
    }

    const userId = (customer as any).metadata?.userId;
    if (!userId) {
      console.log('No userId in customer metadata');
      return;
    }

    await storage.updateUserStripeInfo(userId, {
      stripeSubscriptionId: null,
    });
    console.log(`Removed subscription for user ${userId}`);
  }
}
