import { useCallback, useState } from 'react';
import { Splash } from './components/Splash';
import { Home } from './components/Home';
import { ProductPage } from './components/ProductPage';
import { useRoute } from './lib/router';

export default function App() {
  const [splash, setSplash] = useState(true);
  const route = useRoute();
  const done = useCallback(() => setSplash(false), []);

  return (
    <div className="app">
      {splash && <Splash onDone={done} />}
      <div className="screen" key={route.name === 'product' ? route.id : 'home'} data-route={route.name}>
        {route.name === 'product' ? <ProductPage id={route.id} /> : <Home />}
      </div>
    </div>
  );
}
