import { reactive } from 'vue';
import { TRADE_COLLECTION } from './constants';

export const collectionStore = reactive({
  activeCollection: localStorage.getItem('activeCollection') || TRADE_COLLECTION,

  setActiveCollection(name) {
    this.activeCollection = name;
    localStorage.setItem('activeCollection', name);
  }
});
