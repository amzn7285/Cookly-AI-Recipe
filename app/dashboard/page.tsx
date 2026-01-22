'use client';

import { useSupabase } from '../../contexts/SupabaseContext';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  cookTime?: string;
  difficulty?: string;
}

export default function Dashboard() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [step, setStep] = useState<'upload' | 'ingredients' | 'preferences' | 'recipes'>('upload');
  const [newIngredient, setNewIngredient] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/');
    }
  }, [session, authLoading, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setImage(file);
      setLoading(true);
      setError(null);
      
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Vision API failed');
        }
        
        const data = await res.json();
        
        if (data.ingredients && data.ingredients.length > 0) {
          // Normalize and deduplicate ingredients
          const normalized = [...new Set(
            data.ingredients.map((ing: string) => 
              ing.toLowerCase().trim()
            )
          )];
          setIngredients(normalized);
          setStep('ingredients');
        } else {
          setError('No ingredients detected. Try a clearer image or add manually.');
          setIngredients([]);
          setStep('ingredients');
        }
      } catch (err: any) {
        console.error('Vision error:', err);
        setError(err.message || 'Error processing image. Check connection.');
        setStep('ingredients');
      }
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.toLowerCase().trim())) {
      setIngredients([...ingredients, newIngredient.toLowerCase().trim()]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, value: string) => {
    setIngredients(ingredients.map((ing, i) => i === index ? value.toLowerCase().trim() : ing));
  };

  const handleGenerateRecipes = async () => {
    if (!mealType || !cuisine || ingredients.length === 0) {
      setError('Please select meal type, cuisine, and have at least one ingredient.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ ingredients, mealType, cuisine }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Recipe API failed');
      }
      
      const data = await res.json();
      
      if (data.recipes && data.recipes.length > 0) {
        setRecipes(data.recipes);
        setStep('recipes');
      } else {
        setError('No recipes generated. Try different ingredients or preferences.');
      }
    } catch (err: any) {
      console.error('Recipe error:', err);
      setError(err.message || 'Error generating recipes. Try again.');
    }
    setLoading(false);
  };

  const resetFlow = () => {
    setImage(null);
    setImagePreview(null);
    setIngredients([]);
    setMealType('');
    setCuisine('');
    setRecipes([]);
    setError(null);
    setStep('upload');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🍳</span>
          <h1 className="text-xl font-bold text-gray-800">Cookly AI</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="text-red-500 hover:text-red-600 font-medium"
        >
          Logout
        </button>
      </header>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {['upload', 'ingredients', 'preferences', 'recipes'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-primary text-white'
                  : ['upload', 'ingredients', 'preferences', 'recipes'].indexOf(step) > i
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            {i < 3 && (
              <div
                className={`w-8 h-1 ${
                  ['upload', 'ingredients', 'preferences', 'recipes'].indexOf(step) > i
                    ? 'bg-green-200'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-center mb-4">📸 Upload Pantry Image</h2>
          <p className="text-gray-600 text-center mb-6">
            Take a photo of your fridge or pantry, and we'll identify the ingredients!
          </p>
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
          
          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  📷 Take Photo / Upload
                </>
              )}
            </button>
            
            <button
              onClick={() => setStep('ingredients')}
              className="btn-secondary w-full"
            >
              ✏️ Add Ingredients Manually
            </button>
          </div>

          {loading && (
            <div className="mt-6">
              <p className="text-center text-gray-500 mb-2">Analyzing image...</p>
              <Skeleton count={3} height={20} className="mb-2" />
            </div>
          )}
        </div>
      )}

      {/* Step 2: Ingredients */}
      {step === 'ingredients' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-center mb-4">🥕 Your Ingredients</h2>
          
          {imagePreview && (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Uploaded pantry"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          
          <p className="text-gray-600 text-center mb-4">
            Edit, add, or remove ingredients as needed
          </p>

          {/* Add new ingredient */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
              placeholder="Add ingredient..."
              className="input-field flex-1"
            />
            <button
              onClick={handleAddIngredient}
              className="btn-primary px-4"
            >
              +
            </button>
          </div>

          {/* Ingredients list */}
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {ingredients.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No ingredients yet. Add some above!</p>
            ) : (
              ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                  <input
                    type="text"
                    value={ing}
                    onChange={(e) => handleUpdateIngredient(i, e.target.value)}
                    className="flex-1 bg-transparent border-none focus:outline-none"
                  />
                  <button
                    onClick={() => handleRemoveIngredient(i)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={resetFlow} className="btn-secondary flex-1">
              ← Back
            </button>
            <button
              onClick={() => setStep('preferences')}
              disabled={ingredients.length === 0}
              className="btn-primary flex-1"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 'preferences' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-center mb-4">🍽️ Meal Preferences</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal Type
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="input-field"
            >
              <option value="">Select Meal Type</option>
              <option value="Breakfast">🌅 Breakfast</option>
              <option value="Lunch">☀️ Lunch</option>
              <option value="Dinner">🌙 Dinner</option>
              <option value="Snack">🍿 Snack</option>
              <option value="Dessert">🍰 Dessert</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuisine Style
            </label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="input-field"
            >
              <option value="">Select Cuisine</option>
              <option value="Indian">🇮🇳 Indian</option>
              <option value="Italian">🇮🇹 Italian</option>
              <option value="Chinese">🇨🇳 Chinese</option>
              <option value="Mexican">🇲🇽 Mexican</option>
              <option value="American">🇺🇸 American</option>
              <option value="Mediterranean">🫒 Mediterranean</option>
              <option value="Japanese">🇯🇵 Japanese</option>
              <option value="Thai">🇹🇭 Thai</option>
              <option value="Continental">🌍 Continental</option>
              <option value="Other">🍴 Other/Fusion</option>
            </select>
          </div>

          {/* Grocery suggestions for Indian cuisine */}
          {cuisine === 'Indian' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-orange-800 mb-2">🛒 Need more ingredients?</h3>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.zomato.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600"
                >
                  Zomato
                </a>
                <a
                  href="https://blinkit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm hover:bg-yellow-600"
                >
                  Blinkit
                </a>
                <a
                  href="https://www.swiggy.com/instamart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm hover:bg-orange-600"
                >
                  Instamart
                </a>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep('ingredients')} className="btn-secondary flex-1">
              ← Back
            </button>
            <button
              onClick={handleGenerateRecipes}
              disabled={!mealType || !cuisine || loading}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                '✨ Generate Recipes'
              )}
            </button>
          </div>

          {loading && (
            <div className="mt-6">
              <p className="text-center text-gray-500 mb-2">Creating delicious recipes...</p>
              <Skeleton count={3} height={100} className="mb-2" />
            </div>
          )}
        </div>
      )}

      {/* Step 4: Recipes */}
      {step === 'recipes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🍽️ Your Recipes</h2>
            <button onClick={resetFlow} className="text-primary font-medium">
              + New Search
            </button>
          </div>

          {recipes.length === 0 ? (
            <div className="card text-center">
              <p className="text-gray-500">No recipes found. Try different ingredients.</p>
              <button onClick={() => setStep('preferences')} className="btn-primary mt-4">
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe, i) => (
                <div key={i} className="card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {recipe.title || `Recipe ${i + 1}`}
                  </h3>
                  
                  {recipe.cookTime && (
                    <p className="text-sm text-gray-500 mb-2">⏱️ {recipe.cookTime}</p>
                  )}
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Ingredients:</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {recipe.ingredients?.map((ing, j) => (
                        <li key={j}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Instructions:</h4>
                    <ol className="list-decimal list-inside text-gray-600 space-y-2">
                      {recipe.instructions?.map((step, j) => (
                        <li key={j}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Privacy & Beta Notice */}
      <div className="mt-8">
        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="text-gray-500 text-sm underline w-full text-center"
        >
          Privacy & Beta Notice {showPrivacy ? '▲' : '▼'}
        </button>
        
        {showPrivacy && (
          <div className="mt-2 p-4 bg-gray-100 rounded-lg text-sm text-gray-600 space-y-2">
            <p>⚠️ This app is an MVP / Beta version and features may change.</p>
            <p>🔒 Only minimal data required for functionality is collected.</p>
            <p>🚫 User data is not sold or rented to third parties.</p>
            <p>📷 Uploaded images are processed only for ingredient detection.</p>
            <p>🤖 AI results may not always be accurate and require user confirmation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
