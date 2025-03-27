import { useState, useEffect } from 'react'
import { getItemData, IItemData } from './getItemData'
import { AltShops } from './alternativeShops'
import { googleLogin, getUserInfo, IUserInfo} from './googleLogin'
import './styles/App.css'

function App() {
  const [itemData, setItemData] = useState<IItemData | null>(null);
  const [seeAltShop, setSeeAltShop] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<IUserInfo | undefined>(undefined);
  // console.log(`userInfo:`, userInfo);

  useEffect(() => {
    getItemData().then((data) => setItemData(data));
    try {
      getUserInfo().then((data) => {setUserInfo(data); console.log(`data:`, data)});
    } catch (error) {
      console.error(`error:`, error)
    }
  }, []);

  // return <AltShops setSeeAltShop={setSeeAltShop} itemData={itemData as IItemData} />;

  if (!itemData) {
    return (
      <div className="main-no-data">
        <p>Can't load data from outside Amazon...</p>
      </div>
    );
  }

  if (itemData.brandName == 'none' && itemData.name == 'none') {
    return (
      <div className="main-no-data">
        <p>No product found on this page</p>
      </div>
    );
  }

  if (!seeAltShop) {
    return (
      <>
        <p className="pres-text">No shops listed ?<br/>click the links to search by name or brand (edit if needed).</p>
        <p>Name: <a target="_blank" href={`https://www.google.com/search?q=${itemData.name}`}>{itemData.name}</a></p>
        <p>Brand:  <a target="_blank" href={`https://www.google.com/search?q=${itemData.brandName}`}>{itemData.brandName}</a></p>
        <p>ASIN:  <a target="_blank" href={`https://www.google.com/search?q=${itemData.asin}`}>{itemData.asin}</a></p>
        <div className='footer-wrapper'>
          <button className='shop-button' onClick={() => setSeeAltShop(true)}>See other shops</button>
          {
            userInfo && <img src={userInfo.picture} className="profile-picture"></img>
          ||
            <button className='shop-button' onClick={() => googleLogin(setUserInfo)}>login</button>
          }
        </div>
      </>
    )
  } else {
    return <AltShops setSeeAltShop={setSeeAltShop} itemData={itemData} userId={userInfo?.sub} />;
  }
}

export default App
