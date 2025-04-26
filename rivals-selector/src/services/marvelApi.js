const PROXY_URL = 'http://localhost:3001';

// === SIMPLIFIED FETCH FUNCTION === //
const fetchFromProxy = async (endpoint) => {
  const response = await fetch(`${PROXY_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json' // Removed Content-Type for GET requests
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Request failed');
  }

  return response.json();
};

export const fetchAllHeroes = async () => {
  return fetchFromProxy('/api/heroes');
};

export const fetchHeroDetails = async (heroName) => {
  if (!heroName) throw new Error('Hero name is required');
  return fetchFromProxy(`/api/heroes/information/${encodeURIComponent(heroName)}`);
};

export const fetchAllHeroesWithImages = async () => {
    // First get basic hero list
    const heroes = await fetchFromProxy('/api/heroes');
    
    // Fetch details for each hero to get proper image URLs
    const heroesWithImages = await Promise.all(
      heroes.map(async hero => {
        try {
          const details = await fetchFromProxy(`/api/heroes/information/${encodeURIComponent(hero.name)}`);
          return {
            ...hero,
            image_square: getHeroImage(details.image_square.split('/').pop())
          };
        } catch (error) {
          console.error(`Failed to fetch details for ${hero.name}:`, error);
          return {
            ...hero,
            image_square: getHeroImage(`${hero.name.toLowerCase()}-square.png`)
          };
        }
      })
    );
  
    return heroesWithImages;
  };

// Add this new helper function after your existing exports
export const getHeroImage = (imagePath) => {
    return `${PROXY_URL}/images/${encodeURIComponent(imagePath)}`;
  };
  