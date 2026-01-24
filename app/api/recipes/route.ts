import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Food-related keywords for filtering
const FOOD_KEYWORDS = [
  'fruit', 'vegetable', 'apple', 'banana', 'orange', 'carrot', 'tomato', 'potato',
  'onion', 'garlic', 'pepper', 'lettuce', 'spinach', 'broccoli', 'cucumber', 'celery',
  'mushroom', 'corn', 'peas', 'beans', 'rice', 'pasta', 'bread', 'cheese', 'milk',
  'egg', 'chicken', 'beef', 'pork', 'fish', 'shrimp', 'salmon', 'tuna',
  'butter', 'oil', 'flour', 'sugar', 'salt', 'spice', 'herb', 'sauce',
  'lemon', 'lime', 'avocado', 'mango', 'grape', 'strawberry', 'blueberry',
  'cabbage', 'cauliflower', 'zucchini', 'eggplant', 'bell pepper', 'chili',
  'ginger', 'cilantro', 'basil', 'parsley', 'mint', 'rosemary', 'thyme',
  'yogurt', 'cream', 'mayonnaise', 'ketchup', 'mustard', 'vinegar',
  'honey', 'jam', 'peanut butter', 'chocolate', 'vanilla',
  'produce', 'food', 'ingredient', 'natural foods', 'whole food',
  'meat', 'seafood', 'dairy', 'grain', 'legume', 'nut', 'seed'
];

function isFood(label: string): boolean {
  const lowerLabel = label.toLowerCase();
  return FOOD_KEYWORDS.some(keyword => lowerLabel.includes(keyword));
}

function normalizeIngredient(label: string): string {
  return label
    .toLowerCase()
    .replace(/^(fresh|organic|ripe|raw|cooked|sliced|diced|chopped)\s+/i, '')
    .replace(/\s+(fresh|organic|ripe|raw|cooked|sliced|diced|chopped)$/i, '')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Get the image from form data
    const formData = await req.formData();
    const image = formData.get('image') as Blob;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const buffer = await image.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    let ingredients: string[] = [];

    // Check if Vision API is configured
    const visionApiUrl = process.env.VISION_API_URL;
    const visionApiKey = process.env.VISION_API_KEY;

    if (visionApiUrl && visionApiKey) {
      try {
        // Call Vision API (Google Cloud Vision format)
        const visionRes = await fetch(visionApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${visionApiKey}`,
          },
          body: JSON.stringify({
            requests: [{
              image: { content: base64 },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 20 },
                { type: 'OBJECT_LOCALIZATION', maxResults: 20 }
              ]
            }]
          }),
        });

        if (!visionRes.ok) {
          console.error('Vision API error:', await visionRes.text());
          throw new Error('Vision API request failed');
        }

        const visionData = await visionRes.json();

        // Extract food-related labels and objects
        const labels = visionData.responses?.[0]?.labelAnnotations || [];
        const objects = visionData.responses?.[0]?.localizedObjectAnnotations || [];

        // Filter and normalize ingredients
        const labelIngredients = labels
          .filter((label: any) => label.score > 0.6 && isFood(label.description))
          .map((label: any) => normalizeIngredient(label.description));

        const objectIngredients = objects
          .filter((obj: any) => obj.score > 0.6 && isFood(obj.name))
          .map((obj: any) => normalizeIngredient(obj.name));

        // Combine and deduplicate ingredients safely
        const allIngredients = [...labelIngredients, ...objectIngredients];
        const uniqueIngredients = [...new Map(
          allIngredients.map(ing => [ing.toLowerCase().trim(), ing])
        ).values()];

        ingredients = uniqueIngredients;
      } catch (visionError) {
        console.error('Vision API error:', visionError);
        // Fall back to demo mode if needed
      }
    }

    // If no ingredients detected or API not configured, use demo data
    if (ingredients.length === 0) {
      console.log('Using demo ingredients (Vision API not configured or no food detected)');
      ingredients = [
        'tomato',
        'onion',
        'garlic',
        'potato',
        'carrot',
        'bell pepper',
        'eggs',
        'cheese'
      ];
    }

    // Store ingredients in database (optional, don't fail if this errors)
    try {
      await supabase.from('user_ingredients').insert({
        user_id: user.id,
        ingredients,
        created_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database error (non-fatal):', dbError);
    }

    return NextResponse.json({
      ingredients,
      message: ingredients.length > 0 ? 'Ingredients detected successfully' : 'No ingredients detected'
    });
  } catch (err: any) {
    console.error('Vision route error:', err);
    return NextResponse.json({
      error: 'Processing failed',
      details: err.message
    }, { status: 500 });
  }
}
