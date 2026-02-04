import Stripe from 'stripe';

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.secret) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return connectionSettings.settings.secret;
}

async function seedProducts() {
  console.log('Getting Stripe credentials...');
  const secretKey = await getCredentials();
  
  const stripe = new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });

  console.log('Creating Stripe products...');

  const existingProducts = await stripe.products.search({ 
    query: "name:'Song Purchase' OR name:'Library Storage'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Products already exist:');
    existingProducts.data.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    console.log('Skipping creation. Delete existing products to recreate.');
    return;
  }

  const songProduct = await stripe.products.create({
    name: 'Song Purchase',
    description: 'Purchase a song from the Afrokaviar music catalogue',
    metadata: {
      type: 'song_purchase',
    }
  });
  console.log(`Created product: ${songProduct.name} (${songProduct.id})`);

  const songPrice = await stripe.prices.create({
    product: songProduct.id,
    unit_amount: 100,
    currency: 'usd',
    metadata: {
      type: 'song_purchase',
    }
  });
  console.log(`Created price: $1.00 for songs (${songPrice.id})`);

  const libraryProduct = await stripe.products.create({
    name: 'Library Storage',
    description: '50GB cloud storage for your personal music library',
    metadata: {
      type: 'library_subscription',
      storage_gb: '50',
    }
  });
  console.log(`Created product: ${libraryProduct.name} (${libraryProduct.id})`);

  const libraryPrice = await stripe.prices.create({
    product: libraryProduct.id,
    unit_amount: 500,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      type: 'library_subscription',
    }
  });
  console.log(`Created price: $5.00/month for library (${libraryPrice.id})`);

  console.log('\nStripe products seeded successfully!');
  console.log('Products will be synced to the database via webhooks.');
}

seedProducts().catch(console.error);
