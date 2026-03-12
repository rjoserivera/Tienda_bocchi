// Native Weather Widget Logic using Open-Meteo API
        const weatherWidget = document.getElementById('weatherWidget');
        const weatherToggleIcon = document.getElementById('weatherToggleIcon');
        const weatherTemp = document.getElementById('weatherTemp');
        const weatherDesc = document.getElementById('weatherDesc');
        const weatherLocation = document.getElementById('weatherLocation');
        
        async function fetchWeather(lat, lon, locationName) {
            try {
                // Fetch from free Open-Meteo API
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                const data = await res.json();
                
                const temp = Math.round(data.current_weather.temperature);
                const code = data.current_weather.weathercode;
                const isDay = data.current_weather.is_day === 1;
                
                weatherTemp.innerText = temp + '°C';
                weatherLocation.innerText = locationName;
                
                // WMO Weather interpretation codes
                const codes = {
                    0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
                    45: 'Niebla', 48: 'Niebla escarchada', 51: 'Llovizna leve', 53: 'Llovizna',
                    55: 'Llovizna densa', 61: 'Lluvia leve', 63: 'Lluvia moderada', 65: 'Lluvia fuerte',
                    71: 'Nieve leve', 73: 'Nieve moderada', 75: 'Nieve fuerte', 95: 'Tormenta'
                };
                
                weatherDesc.innerText = codes[code] || 'Variable';

                // Set semantic icon based on actual current weather and time
                const hour = new Date().getHours();
                const isSunset = (hour >= 18 && hour < 20);

                if (code <= 1) {
                    weatherToggleIcon.innerText = isDay ? (isSunset ? '🌇' : '☀️') : '🌙';
                } else if (code <= 3) {
                    weatherToggleIcon.innerText = isDay ? '⛅' : '☁️';
                } else if (code >= 51 && code <= 65) {
                    weatherToggleIcon.innerText = '🌧️';
                } else if (code >= 71 && code <= 85) {
                    weatherToggleIcon.innerText = '❄️';
                } else if (code >= 95) {
                    weatherToggleIcon.innerText = '⛈️';
                } else {
                    weatherToggleIcon.innerText = isDay ? '☀️' : '🌙';
                }

            } catch (err) {
                weatherDesc.innerText = 'Error al cargar';
                weatherToggleIcon.innerText = '☁️'; // Fallback
            }
        }
        
        // Attempt to get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    try {
                        // Reverse geocoding to get city name
                        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
                        const geoData = await geoRes.json();
                        const city = geoData.locality || geoData.city || geoData.principalSubdivision || "Tu Ubicación";
                        fetchWeather(lat, lon, city);
                    } catch(e) {
                        fetchWeather(lat, lon, "Tu Ubicación");
                    }
                },
                (error) => {
                    // Fallback to Coihueco if user denies or location fails
                    fetchWeather(-36.76, -71.83, "Coihueco, Ñuble");
                }
            );
        } else {
            // Fallback for browsers without geolocation
            fetchWeather(-36.76, -71.83, "Coihueco, Ñuble");
        }

        weatherWidget.addEventListener('click', () => {
            weatherWidget.classList.toggle('expanded');
        });

        // Music Player Logic
        const bgMusic = document.getElementById('bgMusic');
        const playBtn = document.getElementById('playBtn');
        let isPlaying = false;

        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                bgMusic.pause();
                playBtn.innerHTML = '▶';
            } else {
                bgMusic.play();
                playBtn.innerHTML = '⏸';
            }
            isPlaying = !isPlaying;
        });

        // Set volume so it's not too loud
        bgMusic.volume = 0.3;

        // Auto-play logic since browsers block raw autoplay
        let hasInteracted = false;
        
        function startMusic() {
            if (!hasInteracted) {
                bgMusic.play().then(() => {
                    isPlaying = true;
                    playBtn.innerHTML = '⏸';
                    hasInteracted = true;
                }).catch(e => console.log('Autoplay blocked by browser until more interaction'));
                
                // Remove listeners once activated
                document.removeEventListener('click', startMusic);
                document.removeEventListener('touchstart', startMusic);
                document.removeEventListener('keydown', startMusic);
            }
        }

        // Listen for any user interaction on the whole document
        document.addEventListener('click', startMusic);
        document.addEventListener('touchstart', startMusic);
        document.addEventListener('keydown', startMusic);

        // Preloader Logic
        window.addEventListener('load', () => {
            setTimeout(() => {
                const preloader = document.getElementById('preloader');
                preloader.classList.add('preloader-hidden');
                document.body.classList.remove('loading');
            }, 1500); // 1.5 segundos de giro
        });

        document.addEventListener('DOMContentLoaded', () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible-embed');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });

            document.querySelectorAll('.hidden-embed').forEach((el, index) => {
                el.style.transitionDelay = `${index * 0.1}s`;
                observer.observe(el);
            });

            // Smooth scrolling for navigation
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    document.querySelector(this.getAttribute('href')).scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
        });