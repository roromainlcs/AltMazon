import { useState } from 'react';
import './styles/alternativeShops.css';
import { addAltShop } from './backRequest';
import { useStore } from './viewStore';
import { currencies } from './lib/types'

export function AddAltShop() {
  const [link, setLink] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('EUR');
  const { itemData, setView } = useStore();

  return(
    <>
      <div className='add-shop-header'>
        <button className='shop-button' onClick={() => setView('altShops')}>Go back</button>
        <button className='add-shop-button' onClick={async () => {
          await addAltShop(itemData.asin, link, price, currency);
          setView('altShops');
        }}>Add</button>
      </div>
      <div className='shop-form'>
        <div className='shop-form-input-wrapper'>
          <label htmlFor='link'>Link</label>
          <input type='text' id='link' value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div className='shop-form-input-wrapper'>
          <label htmlFor='price'>Price</label>
          <div className='shop-form-input-price-wrapper'>
            <input className="shop-form-input-price" type='number' id='price' value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} />
            <select id='currency' value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencies.map((currenciesItem) => (
                <option key={currenciesItem.code} value={currenciesItem.code}>
                  {currenciesItem.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
