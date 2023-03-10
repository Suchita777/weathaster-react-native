import { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  Platform,
  ImageBackground,
  TextInput,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { WebView } from 'react-native-webview';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function sendPushNotification(expoPushToken, title) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: 'And here is the body!',
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function fetchFeed() {
    const response = await fetch(
      'https://api.reliefweb.int/v1/reports?appname=apidoc&limit=10'
    ).then((res) => res.json());
    console.log('sent Notification');
    sendPushNotification(expoPushToken, response.data[4].fields.title);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchFeed();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const image = {
    uri: 'https://res.cloudinary.com/dashcord/image/upload/v1678462896/taylor-van-riper-yQorCngxzwI-unsplash_stdlaw.jpg',
  };

  const [search, onChangeSearch] = useState('Denver');
  const [weather, setWeather] = useState();

  async function fetchWeather() {
    const apiKey = 'ac77fc75f4523fc2c74b8a9c25457e3e';
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${search}&units=metric&appid=${apiKey}`
    ).then((res) => res.json());
    console.log(response);

    setWeather(response);
  }
  useEffect(() => {
    const getWeather = setTimeout(() => {
      fetchWeather();
    }, 1000);
    return () => clearTimeout(getWeather);
  }, [search]);

  return (
    <View className='flex-1 flex-col'>
      <ImageBackground
        source={image}
        className='flex-1 bg-cover justify-center p-4 pb-0'>
        <View className='items-center justify-center'>
          <ScrollView className='w-full'>
            <View className='w-full min-h-[25%] bg-slate-900 rounded-xl p-4 mb-8'>
              <TextInput
                onChangeText={onChangeSearch}
                className='shrink-0 bg-slate-600 rounded-full p-2 px-3 text-white'
              />

              <Text className='mt-3 text-2xl font-semibold text-white'>
                Weather in {search}
              </Text>
              {weather ? (
                <View>
                  <Text className='text-2xl mt-1 text-white font-semibold'>
                    {weather.main.temp}°C
                  </Text>
                  <View className='flex flex-row mt-6 items-center'>
                    <Image
                      source={{
                        uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`,
                      }}
                      style={{ width: 50, height: 50 }}
                    />
                    <Text className='text-lg text-white capitalize'>
                      {weather.weather[0].description}
                    </Text>
                  </View>
                  <Text className='text-lg text-white'>
                    Humidity : {weather.main.humidity}%
                  </Text>
                  <Text className='text-lg mt-1 text-white'>
                    Wind Speed : {weather.wind.speed} km/h
                  </Text>
                </View>
              ) : null}
            </View>

            <WebView
              style={{ height: 250, marginTop: 20 }}
              originWhitelist={['*']}
              source={{
                uri: 'https://takshakramteke.github.io/rssfeed/',
              }}
            />
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}
