import { useCallback, useEffect, useState } from 'react';
import { Splash } from './components/Splash';
import { Login } from './components/Login';
import { ProfileForm } from './components/ProfileForm';
import { Home } from './components/Home';
import { ProductPage } from './components/ProductPage';
import { useRoute } from './lib/router';
import { session, useSession } from './lib/session';
import { api } from './api';

export default function App() {
  const [splash, setSplash] = useState(true);
  const { token, user } = useSession();
  const route = useRoute();
  const done = useCallback(() => setSplash(false), []);

  // Refresh the stored user on launch. A revoked/expired token logs the user out (handled in api.ts).
  useEffect(() => {
    if (token) api.me().then(({ user }) => session.setUser(user), () => {});
  }, [token]);

  let screen: JSX.Element;
  let key: string;
  if (!token || !user) {
    screen = <Login />;
    key = 'login';
  } else if (!user.profile) {
    screen = <ProfileForm mode="setup" />;
    key = 'setup';
  } else if (route.name === 'product') {
    screen = <ProductPage id={route.id} />;
    key = `p:${route.id}`;
  } else if (route.name === 'profile') {
    screen = <ProfileForm mode="edit" />;
    key = 'profile';
  } else {
    screen = <Home />;
    key = 'home';
  }

  return (
    <div className="app">
      {splash && <Splash onDone={done} />}
      <div className="screen" key={key}>
        {screen}
      </div>
    </div>
  );
}
