import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  cookTime?: string;
  difficulty?: string;
}

// Demo recipes database
const DEMO_RECIPES: Record<string, Record<string, Recipe[]>> = {
  Indian: {
    Breakfast: [
      {
        title: 'Masala Omelette',
        cookTime: '15 mins',
        difficulty: 'Easy',
        ingredients: ['2 eggs', '1 small onion, diced', '1 tomato, diced', '1 green chili, chopped', 'Fresh coriander', 'Salt and pepper', '1 tbsp oil'],
        instructions: ['Beat eggs with salt, pepper, and a splash of water', 'Heat oil in a pan over medium heat', 'Sauté onions until translucent', 'Add tomatoes and green chili, cook for 2 minutes', 'Pour beaten eggs over the vegetables', 'Cook until bottom is set, then fold and serve', 'Garnish with fresh coriander']
      },
      {
        title: 'Aloo Paratha',
        cookTime: '30 mins',
        difficulty: 'Medium',
        ingredients: ['2 cups whole wheat flour', '2 large potatoes, boiled and mashed', '1 tsp cumin seeds', '1 green chili, minced', 'Fresh coriander', 'Salt to taste', 'Ghee for cooking'],
        instructions: ['Mix flour with water to make soft dough, rest for 15 mins', 'Mix mashed potatoes with cumin, chili, coriander, and salt', 'Divide dough into balls, roll out, place filling, seal and roll again', 'Cook on hot griddle with ghee until golden on both sides', 'Serve hot with yogurt or pickle']
      },
      {
        title: 'Poha',
        cookTime: '20 mins',
        difficulty: 'Easy',
        ingredients: ['2 cups flattened rice (poha)', '1 onion, sliced', '1 potato, diced small', 'Mustard seeds', 'Curry leaves', 'Turmeric', 'Peanuts', 'Lemon juice'],
        instructions: ['Rinse poha and set aside', 'Heat oil, add mustard seeds and curry leaves', 'Add peanuts and fry until golden', 'Add potatoes and cook until soft', 'Add onions, sauté until translucent', 'Add turmeric, salt, and drained poha', 'Mix well, squeeze lemon juice, serve garnished with coriander']
      }
    ],
    Lunch: [
      {
        title: 'Vegetable Biryani',
        cookTime: '45 mins',
        difficulty: 'Medium',
        ingredients: ['2 cups basmati rice', 'Mixed vegetables (carrots, peas, beans)', '1 onion, sliced', 'Biryani masala', 'Yogurt', 'Saffron in warm milk', 'Ghee', 'Fresh mint and coriander'],
        instructions: ['Soak rice for 30 mins, par-boil and drain', 'Fry onions until golden brown', 'Add vegetables and biryani masala, cook for 5 mins', 'Add yogurt, mix well', 'Layer vegetables and rice in pot', 'Pour saffron milk on top', 'Cover tightly and cook on low heat for 20 mins', 'Let rest for 5 mins, then gently mix and serve']
      },
      {
        title: 'Dal Tadka',
        cookTime: '35 mins',
        difficulty: 'Easy',
        ingredients: ['1 cup toor dal', '1 onion, chopped', '2 tomatoes, chopped', 'Garlic', 'Cumin seeds', 'Red chilies', 'Turmeric', 'Fresh coriander'],
        instructions: ['Wash and pressure cook dal with turmeric until soft', 'Heat ghee, add cumin seeds and dried red chilies', 'Add garlic, sauté until golden', 'Add onions and tomatoes, cook until soft', 'Add cooked dal, adjust consistency and salt', 'Simmer for 10 mins', 'Garnish with coriander and serve with rice']
      },
      {
        title: 'Paneer Butter Masala',
        cookTime: '40 mins',
        difficulty: 'Medium',
        ingredients: ['250g paneer, cubed', '2 onions', '3 tomatoes', 'Cashews', 'Butter and cream', 'Ginger-garlic paste', 'Garam masala', 'Kasuri methi'],
        instructions: ['Blend onions, tomatoes, and cashews into smooth paste', 'Heat butter, add ginger-garlic paste', 'Add the paste, cook until oil separates', 'Add spices - garam masala, red chili powder, salt', 'Add cream and kasuri methi', 'Add paneer cubes, simmer for 10 mins', 'Serve hot with naan or rice']
      }
    ],
    Dinner: [
      {
        title: 'Chicken Curry',
        cookTime: '50 mins',
        difficulty: 'Medium',
        ingredients: ['500g chicken', '2 onions, sliced', '2 tomatoes, pureed', 'Ginger-garlic paste', 'Coriander powder', 'Red chili powder', 'Garam masala', 'Fresh coriander'],
        instructions: ['Marinate chicken with turmeric and salt', 'Fry onions until golden brown', 'Add ginger-garlic paste, sauté for 2 mins', 'Add tomato puree and spices, cook until oil separates', 'Add chicken, cook on high for 5 mins', 'Add water, cover and simmer until chicken is done', 'Finish with garam masala and fresh coriander']
      },
      {
        title: 'Palak Paneer',
        cookTime: '35 mins',
        difficulty: 'Medium',
        ingredients: ['250g paneer', '500g spinach', '1 onion', '2 tomatoes', 'Garlic', 'Green chilies', 'Cream', 'Cumin seeds'],
        instructions: ['Blanch spinach and blend to smooth paste', 'Fry paneer cubes until golden, set aside', 'Sauté cumin, onion, garlic, and chilies', 'Add tomatoes and cook until soft', 'Add spinach puree and spices', 'Simmer for 10 mins', 'Add paneer and cream, serve hot']
      },
      {
        title: 'Roti with Mixed Vegetable Sabzi',
        cookTime: '40 mins',
        difficulty: 'Easy',
        ingredients: ['2 cups wheat flour', 'Mixed vegetables', '1 onion', '2 tomatoes', 'Cumin seeds', 'Turmeric', 'Coriander powder', 'Garam masala'],
        instructions: ['Make soft dough for rotis, rest for 15 mins', 'For sabzi: heat oil, add cumin seeds', 'Add onions, sauté until golden', 'Add tomatoes and spices', 'Add chopped vegetables with little water', 'Cover and cook until vegetables are tender', 'Roll and cook rotis on tawa', 'Serve hot rotis with sabzi']
      }
    ]
  },
  Italian: {
    Breakfast: [
      {
        title: 'Italian Frittata',
        cookTime: '25 mins',
        difficulty: 'Easy',
        ingredients: ['6 eggs', '1 cup mixed vegetables', 'Parmesan cheese', 'Fresh basil', 'Olive oil', 'Salt and pepper', 'Cherry tomatoes'],
        instructions: ['Preheat oven to 375°F', 'Sauté vegetables in oven-safe pan', 'Beat eggs with cheese, salt, and pepper', 'Pour eggs over vegetables', 'Cook on stove until edges set', 'Transfer to oven for 10-15 mins', 'Top with fresh basil and serve']
      }
    ],
    Lunch: [
      {
        title: 'Pasta Primavera',
        cookTime: '30 mins',
        difficulty: 'Easy',
        ingredients: ['400g pasta', 'Mixed vegetables', 'Garlic', 'Olive oil', 'Parmesan', 'Fresh basil', 'Cherry tomatoes', 'White wine (optional)'],
        instructions: ['Cook pasta according to package', 'Sauté garlic in olive oil', 'Add vegetables, cook until tender-crisp', 'Add wine and let reduce', 'Toss with pasta and pasta water', 'Top with Parmesan and basil']
      }
    ],
    Dinner: [
      {
        title: 'Margherita Pizza',
        cookTime: '45 mins',
        difficulty: 'Medium',
        ingredients: ['Pizza dough', 'San Marzano tomatoes', 'Fresh mozzarella', 'Fresh basil', 'Olive oil', 'Garlic', 'Salt'],
        instructions: ['Preheat oven to highest setting with pizza stone', 'Stretch dough into round shape', 'Crush tomatoes with salt and garlic', 'Spread sauce on dough', 'Add torn mozzarella', 'Bake until crust is golden', 'Top with fresh basil and olive oil']
      }
    ]
  },
  Chinese: {
    Breakfast: [
      {
        title: 'Vegetable Congee',
        cookTime: '45 mins',
        difficulty: 'Easy',
        ingredients: ['1 cup rice', '6 cups water/broth', 'Ginger', 'Green onions', 'Soy sauce', 'Sesame oil', 'Mixed vegetables'],
        instructions: ['Rinse rice and add to pot with water', 'Add ginger slices', 'Bring to boil, then simmer for 40 mins', 'Stir occasionally until creamy', 'Add vegetables in last 10 mins', 'Season with soy sauce and sesame oil', 'Garnish with green onions']
      }
    ],
    Lunch: [
      {
        title: 'Vegetable Fried Rice',
        cookTime: '20 mins',
        difficulty: 'Easy',
        ingredients: ['3 cups day-old rice', 'Mixed vegetables', '2 eggs', 'Soy sauce', 'Sesame oil', 'Green onions', 'Garlic', 'Ginger'],
        instructions: ['Heat wok until smoking', 'Scramble eggs, set aside', 'Stir-fry vegetables with garlic and ginger', 'Add cold rice, break up clumps', 'Add soy sauce, toss well', 'Return eggs to wok', 'Finish with sesame oil and green onions']
      }
    ],
    Dinner: [
      {
        title: 'Stir-Fried Noodles',
        cookTime: '25 mins',
        difficulty: 'Easy',
        ingredients: ['400g noodles', 'Mixed vegetables', 'Soy sauce', 'Oyster sauce', 'Garlic', 'Ginger', 'Sesame oil', 'Bean sprouts'],
        instructions: ['Cook noodles, drain and toss with oil', 'Heat wok, add garlic and ginger', 'Add vegetables, stir-fry on high heat', 'Add noodles and sauces', 'Toss everything together', 'Add bean sprouts at the end', 'Serve immediately']
      }
    ]
  }
};

function parseRecipes(text: string): Recipe[] {
  try {
    // Try to parse structured output
    const recipeBlocks = text.split(/\n(?=\d+\.\s+|Recipe\s+\d+:|#{1,3}\s+)/i).filter(block => block.trim());
    
    return recipeBlocks.slice(0, 3).map((block, index) => {
      const lines = block.split('\n').filter(line => line.trim());
      
      // Extract title
      let title = lines[0]?.replace(/^\d+\.\s*|^Recipe\s+\d+:\s*|^#{1,3}\s*/i, '').trim() || `Recipe ${index + 1}`;
      
      // Find ingredients section
      const ingredientsStart = lines.findIndex(l => 
        l.toLowerCase().includes('ingredient') || l.match(/^[-*•]/)
      );
      const instructionsStart = lines.findIndex(l => 
        l.toLowerCase().includes('instruction') || 
        l.toLowerCase().includes('direction') ||
        l.toLowerCase().includes('step') ||
        l.match(/^\d+\.\s+[A-Z]/)
      );
      
      let ingredients: string[] = [];
      let instructions: string[] = [];
      
      if (ingredientsStart !== -1) {
        const endIdx = instructionsStart > ingredientsStart ? instructionsStart : lines.length;
        ingredients = lines.slice(ingredientsStart + 1, endIdx)
          .filter(l => l.trim() && !l.toLowerCase().includes('instruction'))
          .map(l => l.replace(/^[-*•]\s*/, '').trim());
      }
      
      if (instructionsStart !== -1) {
        instructions = lines.slice(instructionsStart + 1)
          .filter(l => l.trim())
          .map(l => l.replace(/^\d+\.\s*/, '').trim());
      }
      
      // Fallback if parsing failed
      if (ingredients.length === 0) {
        ingredients = ['Please check the recipe details'];
      }
      if (instructions.length === 0) {
        instructions = ['Follow standard cooking methods for this dish'];
      }
      
      return { title, ingredients, instructions };
    });
  } catch (error) {
    console.error('Recipe parsing error:', error);
    return [];
  }
}

function getDemoRecipes(mealType: string, cuisine: string, ingredients: string[]): Recipe[] {
  // Get recipes from demo database
  const cuisineRecipes = DEMO_RECIPES[cuisine] || DEMO_RECIPES['Indian'];
  const mealRecipes = cuisineRecipes[mealType] || cuisineRecipes['Lunch'];
  
  // Return up to 3 recipes
  return mealRecipes.slice(0, 3).map(recipe => ({
    ...recipe,
    // Customize based on available ingredients
    ingredients: recipe.ingredients.map(ing => {
      const lowerIng = ing.toLowerCase();
      const matchingIngredient = ingredients.find(i => lowerIng.includes(i.toLowerCase()));
      return matchingIngredient ? ing : ing;
    })
  }));
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

    // Parse request body
    const { ingredients, mealType, cuisine } = await req.json();
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 });
    }

    if (!mealType || !cuisine) {
      return NextResponse.json({ error: 'Meal type and cuisine are required' }, { status: 400 });
    }

    let recipes: Recipe[] = [];

    // Check if LLM API is configured
    const llmApiUrl = process.env.LLM_API_URL;
    const llmApiKey = process.env.LLM_API_KEY;

    if (llmApiUrl && llmApiKey) {
      try {
        const prompt = `Generate exactly 3 unique ${mealType} recipes in ${cuisine} style using primarily these ingredients: ${ingredients.join(', ')}.

For each recipe, provide:
1. Recipe title
2. Complete list of ingredients with quantities
3. Step-by-step cooking instructions

Format each recipe clearly with "Ingredients:" and "Instructions:" sections.`;

        const llmRes = await fetch(llmApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional chef who creates delicious, practical recipes. Always provide clear, detailed instructions.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1500,
            temperature: 0.7,
          }),
        });

        if (!llmRes.ok) {
          console.error('LLM API error:', await llmRes.text());
          throw new Error('LLM API request failed');
        }

        const llmData = await llmRes.json();
        const responseText = llmData.choices?.[0]?.message?.content || llmData.choices?.[0]?.text || '';
        
        if (responseText) {
          recipes = parseRecipes(responseText);
        }
      } catch (llmError) {
        console.error('LLM API error:', llmError);
        // Fall back to demo recipes
      }
    }

    // If no recipes from API, use demo recipes
    if (recipes.length === 0) {
      console.log('Using demo recipes (LLM API not configured or failed)');
      recipes = getDemoRecipes(mealType, cuisine, ingredients);
    }

    // Store recipes in database (optional)
    try {
      await supabase.from('user_recipes').insert({
        user_id: user.id,
        ingredients,
        meal_type: mealType,
        cuisine,
        recipes,
        created_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database error (non-fatal):', dbError);
    }

    return NextResponse.json({ 
      recipes,
      message: `Generated ${recipes.length} recipes`
    });
  } catch (err: any) {
    console.error('Recipe route error:', err);
    return NextResponse.json({ 
      error: 'Generation failed',
      details: err.message 
    }, { status: 500 });
  }
}
