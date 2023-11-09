document.addEventListener('DOMContentLoaded', getWeather);

function getWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchWeather, showError);
    } else {
        document.getElementById('location').innerHTML = "Geolocation is not supported by this browser.";
    }
}

function fetchWeather(position) {
    const apiKey = '0816bb84677e26d84481ec512f665e30';
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const locationElement = document.getElementById('location');
            const weatherElement = document.getElementById('weather');

            const location = data.name + ', ' + data.sys.country;
            const temperature = Math.round(data.main.temp - 273.15); // Convert from Kelvin to Celsius
            const description = data.weather[0].description;

            locationElement.innerHTML = location;
            weatherElement.innerHTML = `Temperature: ${temperature}°C, ${description}`;
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });
}

function showError(error) {
    const locationElement = document.getElementById('location');
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            locationElement.innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            locationElement.innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            locationElement.innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            locationElement.innerHTML = "An unknown error occurred.";
            break;
    }
}
