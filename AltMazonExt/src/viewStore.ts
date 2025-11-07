import { create } from 'zustand';

import { IItemData } from './getItemData'
import { IUserInfo } from './googleLogin'

export type View = 'home' | 'altShops' | 'addAltShop' | 'info';

export type Store = {
  view: View;
  setView: (view: View) => void;
  itemData: IItemData;
  setItemData: (itemData: IItemData) => void;
  userInfo: IUserInfo | undefined;
  setUserInfo: (userInfo: IUserInfo | undefined) => void;
}

export const useStore = create<Store>((set) => ({
  view: localStorage.getItem('view') as View || 'home',
  setView: (view: View) => set({ view }),
  itemData: { name: '', brandName: '', asin: '' },
  setItemData: (itemData: IItemData) => set({ itemData }),
  userInfo: undefined,
  setUserInfo: (userInfo: IUserInfo | undefined) => set({ userInfo }),
}));