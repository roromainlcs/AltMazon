import { useState, useEffect } from 'react';
import Info from './assets/info.tsx';
import VoteButtons from './score';
import './styles/alternativeShops.css';
import { getAltShopList, addProduct, IAltShop, addAltShop, getUserVotes } from './backRequest';
import { IItemData } from './getItemData';

const  currencies = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: '¥' },
  { code: 'SEK', symbol: 'kr' },
  { code: 'SGD', symbol: 'S$' },
];

interface AddAltShopFormProps {
  itemData: IItemData;
  setShowAddAltShop: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DisplayAltShopListProps {
  defaultUserVotes: { [key: string]: number };
  altShopList: IAltShop[];
  setShowAddAltShop: React.Dispatch<React.SetStateAction<boolean>>;
  userId: string | undefined;
  setShowUserNotLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

function AddAltShopForm({ itemData, setShowAddAltShop }: AddAltShopFormProps) {
  const [link, setLink] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('EUR');

  return(
    <>
      <div className='add-shop-header'>
        <button className='shop-button' onClick={() => setShowAddAltShop(false)}>Go back</button>
        <button className='add-shop-button' onClick={async () => {
          await addAltShop(itemData.asin, link, price, currency);
          setShowAddAltShop(false);
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

function getShopName(link: string): string {
  const url = new URL(link);
  return url.hostname.slice(url.hostname.indexOf('.') + 1);
}

function DisplayAltShopList({ defaultUserVotes, altShopList, setShowAddAltShop, userId, setShowUserNotLoggedIn }: DisplayAltShopListProps) {
  return (
    <>
      <div className='shop-list-header'>
        <div>Shop</div>
        <div>Price</div>
        <div>Score</div>
      </div>
      <div className='shop-list'>
        {
          altShopList?.length == 0 && <div>No alternative shops found</div>
          ||
          altShopList.map((shop, index) => (
            <div key={index} className='shop-list-item'>
              <div className="shop-list-item-name"><a href={shop.link} target='_blank' rel='noreferrer' title={shop.link}>{getShopName(shop.link)}</a></div>
              <div className="shop-list-item-price">{shop.price}{currencies.find(c => c.code === shop.currency)?.symbol || '?'}</div>
              <VoteButtons defaultUserVote={defaultUserVotes[shop.id]} initialVotes={shop.score} shopId={shop.id} userId={userId} setShowUserNotLoggedIn={setShowUserNotLoggedIn}/>
            </div>
          ))
        }
      </div>
      <button onClick={() => userId ? setShowAddAltShop(true) : setShowUserNotLoggedIn(true)}>+</button>
    </>
  );
}

export function AltShops({ setSeeAltShop, itemData, userId }: {setSeeAltShop :React.Dispatch<React.SetStateAction<boolean>>, itemData: IItemData, userId: string | undefined}) {
  const [altShopList, setAltShopList] = useState<IAltShop[] | null>(null);
  const [showAddAltShop, setShowAddAltShop] = useState<boolean>(false);
  const [showUserNotLoggedIn, setShowUserNotLoggedIn] = useState<boolean>(false);
  const [warningClassName, setWarningClassName] = useState<string>('user-not-logged-in');
  const [defaultUserVotes, setDefaultUserVotes] = useState<{ [key: string]: number }>({});
  const [errorLoading, setErrorLoading] = useState<string>('');

  useEffect(() => {
    async function loadAltShopList() {
      try {
        const data = await getAltShopList(itemData.asin);
        const votes: [] = await getUserVotes(itemData.asin);
        console.log("votes", votes);
        console.log("data", data);
        const votesDict: { [key: string]: number } = votes.reduce((acc, { id, vote }) => {
          acc[id] = vote;
          return acc;
        }, {} as { [key: string]: number });
        setAltShopList(data);
        setDefaultUserVotes(votesDict);
      } catch (e: unknown) {
        // if product not found, add it to the database
        if (e instanceof Error && e.message === "Product not found") {
          setAltShopList([]);
          try {
            addProduct(itemData.asin, itemData.name, itemData.brandName);
          } catch (e: unknown) {
            console.error("error adding product:", e);
            setErrorLoading("Error creating product");
          }
        } else if (e instanceof Error && e.message == 'Failed to fetch') {
          setErrorLoading("cannot access the server");
          console.error("error loading alt shops:", e.message);
        }
      }
    }
    loadAltShopList();
  }, [itemData]);

  useEffect(() => {
    if (showUserNotLoggedIn) {
      setWarningClassName('user-not-logged-in show-user-not-logged-in');
      setTimeout(() => {
        setShowUserNotLoggedIn(false);
        setWarningClassName('user-not-logged-in');
      }, 3000);
    }
  }, [showUserNotLoggedIn]);

  if (showAddAltShop) {
    return (
      <AddAltShopForm itemData={itemData} setShowAddAltShop={setShowAddAltShop} />
    );
  }

  return (
    <>
      <div className='shop-header'>
        <button className='shop-button' onClick={() => setSeeAltShop(false)}>Go back</button>
        <Info />
        </div>
      <div className='shop-list-wrapper'>
        {
          altShopList == null && errorLoading != '' && <p>{errorLoading}</p>
          ||
          altShopList == null && <p>Loading...</p>
          ||
          <DisplayAltShopList defaultUserVotes={defaultUserVotes} altShopList={altShopList as IAltShop[]} setShowAddAltShop={setShowAddAltShop} userId={userId} setShowUserNotLoggedIn={setShowUserNotLoggedIn} />
        }
          <p className={warningClassName} onClick={() => setWarningClassName('user-not-logged-in')}>You need to be logged in to participate :(</p>
      </div>
    </>
  );
}