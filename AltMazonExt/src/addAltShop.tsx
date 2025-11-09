import { useState } from 'react';
import './styles/addAltShop.css';
import { addAltShop } from './backRequest';
import { useStore } from './store';
import { currencies } from './lib/types'
import Input from './components/input';

const numberRegex = /^(?:\d+|\d*[.,]\d{0,2})$/;


export function AddAltShop() {
  const [link, setLink] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('EUR');
  const { itemData, setView } = useStore();

  function validateAndSetPrice(value: string) {
    if ((value !== '' && !numberRegex.test(value)) || value.length > 8)
      return;
    else if (value === '.' || value === ',')
      setPrice('0' + value);
    else
    setPrice(value);
  }

  async function validateAndAddShop() {
    if (link.trim() === '' || link.indexOf('https') !== 0 || currency === '') {
      console.error('Invalid input:', { link, price, currency });
      return;
    }
    
    try {
      new URL(link);
      await addAltShop(itemData.asin, link, parseFloat(price.replace(',', '.')), currency);
    }
    catch (e) {
      if(e instanceof TypeError) {
        alert('Please enter a valid URL.');
        return;
      } else {
        console.error('Error adding alternative shop:', e);
        alert('There was an error adding the alternative shop. Please try again.');
        return;
      }
    }
    setView('altShops');
  }

  return (
    <div className='add-shop-container'>
      <div className='add-shop-header'>
        <button className='shop-button' onClick={() => setView('altShops')}>Go back</button>
        <button className='add-shop-button' onClick={validateAndAddShop}>Add</button>
      </div>
      <div className='shop-form'>
        <div className='shop-form-input-wrapper'>
          <Input type='text' id='link' value={link} placeholder='Website URL' onChange={(e) => setLink(e.target.value)} />
        </div>
        <div className='shop-form-input-wrapper'>
          <div className='shop-form-input-price-wrapper'>
            <Input type='text' id='price' value={price} placeholder='Price' onChange={(e) => validateAndSetPrice(e.target.value)} />
            <select className='select-currency' id='currency' value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencies.map((currenciesItem) => (
                <option key={currenciesItem.code} value={currenciesItem.code}>
                  {currenciesItem.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}