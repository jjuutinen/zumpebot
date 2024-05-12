const geocodingApiBaseUri = 'https://geocoding-api.open-meteo.com/v1/';

const forecastParams = "hourly=rain,wind_speed_10m&" +
    "forecast_days=1&" +
    "current=temperature_2m&" +
    "format=json&" +
    "timeformat=unixtime";

const forecastApiBaseUri = "https://api.open-meteo.com/v1/forecast";


interface ILocation {
    latitude: string;
    longitude: string;
    name: string;
}

interface IWeather {
    time: Date;
    tempValue: number;
    tempUnit: string;
    rainValue: number;
    rainUnit: string;
    windValue: number;
    windUnit: string;
}

export interface IForecast {
    location: ILocation;
    weather: IWeather;
}


const getCityInformation = async (city: string) => {
    const uri = `${geocodingApiBaseUri}search?name=${city}`;
    const response = await fetch(uri, { method: "GET" });

    const result = await response.json();

    if (Array.isArray(result.results) && result.results.length > 0) {
        const item = result.results[0];

        const values: ILocation = {
            latitude: item.latitude,
            longitude: item.longitude,
            name: item.name
        };

        return values;
    };

    return null;
};

const calcDailyAvg = (values: number[]) => {
    let result = 0;
    for (let i = 0; i < values.length; i++) {
        result = result + values[i];
    }

    return Number((result / values.length).toFixed(1));
};

const calcDailySum = (values: number[]) => {
    let result = 0;
    for (let i = 0; i < values.length; i++) {
        result = result + values[i];
    }

    return Number((result).toFixed(1));
};

const getMaxValue = (values: number[]) => {
    let result = 0;
    for (let i = 0; i < values.length; i++) {
        if (values[i] > result) result = values[i];
    }

    return result;
};

const toMetersPerSec = (value: number) => Number((value / 3.6).toFixed(1));

const getWeatherInfoByCoordinates = async (latitude: string, longitude: string, kph: boolean = false) => {
    const uri = `${forecastApiBaseUri}?${forecastParams}&latitude=${latitude}&longitude=${longitude}`;
    const response = await fetch(
        uri,
        { method: "GET" }
    );

    const result = await response.json();

    if (result && result.hourly && result.hourly_units) {
        const date = new Date(0);
        date.setUTCSeconds(result.current.time);
        return {
            time: date, tempValue: result.current.temperature_2m,
            tempUnit: result.current_units.temperature_2m,
            rainValue: calcDailySum(result.hourly.rain),
            rainUnit: result.hourly_units.rain,
            windValue: kph ? calcDailyAvg(result.hourly.wind_speed_10m) : toMetersPerSec(calcDailyAvg(result.hourly.wind_speed_10m)),
            maxWindValue: kph ? getMaxValue(result.hourly.wind_speed_10m) : toMetersPerSec(getMaxValue(result.hourly.wind_speed_10m)),
            windUnit: kph ? result.hourly_units.wind_speed_10m : "m/s"
        } as IWeather;
    }

    return null;
};


const getWeatherForecast = async (location: string): Promise<IForecast> => {
    const locationInfo = await getCityInformation(location);

    if (!locationInfo) return null;

    const weatherInfo = await getWeatherInfoByCoordinates(locationInfo.latitude, locationInfo.longitude);

    if (!weatherInfo) return null;

    return { location: locationInfo, weather: weatherInfo } as IForecast;
};

module.exports = getWeatherForecast; 