import React, { createContext, useContext, useState, useEffect } from 'react';

const WeatherContext = createContext(null);

export const useWeather = () => useContext(WeatherContext);

// Map weather condition to the season label used in the stylist prompt
export const conditionToSeason = (condition, temp) => {
    if (condition === 'Rain' || condition === 'Drizzle' || condition === 'Thunderstorm') return 'Rainy';
    if (condition === 'Snow') return 'Winter';
    if (temp > 28) return 'Summer';
    if (temp < 15) return 'Winter';
    return 'All Season';
};

export const WeatherProvider = ({ children }) => {
    const [weather, setWeather] = useState(null);   // raw OpenWeatherMap response
    const [season, setSeason] = useState('All Season'); // mapped season label
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
        if (!apiKey) {
            setError('No API key');
            setLoading(false);
            return;
        }
        if (!navigator.geolocation) {
            setError('Geolocation unavailable');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const res = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric`
                    );
                    if (!res.ok) throw new Error('Weather fetch failed');
                    const data = await res.json();
                    const temp = Math.round(data.main.temp);
                    const condition = data.weather[0].main;
                    setWeather(data);
                    setSeason(conditionToSeason(condition, temp));
                } catch {
                    setError('Could not load weather.');
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError('Location permission denied.');
                setLoading(false);
            },
            { timeout: 10000 } // 10 second timeout
        );
    }, []);

    return (
        <WeatherContext.Provider value={{ weather, season, loading, error }}>
            {children}
        </WeatherContext.Provider>
    );
};
