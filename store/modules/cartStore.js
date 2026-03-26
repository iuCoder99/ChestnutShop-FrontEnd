import { defineStore } from 'pinia';
import request from '@/utils/request';
import { useUserStore } from './userStore';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartList: [], // 购物车商品列表
    selectedSpec: {} // 选中的商品规格（产品详情页用）
  }),

  getters: {
    // 选中商品总数
    selectedCount: (state) => {
      return state.cartList.reduce((total, item) => item.checked ? total + item.quantity : total, 0);
    },

    // 选中商品总价
    selectedTotalPrice: (state) => {
      return state.cartList.reduce((total, item) => item.checked ? total + (item.price * item.quantity) : total, 0);
    }
  },

  actions: {
    // 初始化购物车（页面加载时调用）
    async initCart() {
      const userStore = useUserStore();
      if (userStore.isLogin) {
        // 已登录：先尝试从本地持久化缓存加载，提升体验
        const cachedCart = uni.getStorageSync('cart_data');
        if (cachedCart) {
          this.cartList = cachedCart;
        }
        
        // 然后从云端获取最新购物车
        await this.getCartFromCloud();
        // 合并本地临时购物车
        await this.mergeLocalCart();
      } else {
        // 未登录：从本地缓存获取
        this.cartList = uni.getStorageSync('cartTemp') || [];
      }
    },

    // 从云端获取购物车
    async getCartFromCloud() {
      try {
        const res = await request({ url: '/api/cart/list', method: 'GET' });
        if (res.success) {
          const newList = res.data.map(item => ({
            ...item, 
            checked: false,
            // 确保规格文本存在，如果为空则显示"默认规格"
            specText: item.specText || '默认规格'
          }));
          this.cartList = newList;
          // 持久化存储云端购物车数据
          uni.setStorageSync('cart_data', newList);
        }
      } catch (error) {
        uni.showToast({ title: '购物车加载失败', icon: 'none' });
      }
    },

    // 合并本地临时购物车到云端
    async mergeLocalCart() {
      const localCart = uni.getStorageSync('cartTemp') || [];
      if (localCart.length === 0) return;

      try {
        await request({
          url: '/api/cart/merge',
          method: 'POST',
          data: { cartItems: localCart }
        });
        // 合并成功后清空本地临时购物车
        uni.removeStorageSync('cartTemp');
        // 重新获取合并后的购物车
        await this.getCartFromCloud();
      } catch (error) {
        console.log('购物车合并失败', error);
      }
    },

    // 新增商品到购物车
    async addCart(cartData) {
      const userStore = useUserStore();
      // 确保规格文本存在，如果为空则显示"默认规格"
      const processedCartData = {
        ...cartData,
        specText: cartData.specText || '默认规格'
      };
      
      if (userStore.isLogin) {
        // 已登录：添加到云端
        try {
          // 移除发送给后端的冗余字段 specText
          const { specText, ...sendData } = processedCartData;
          await request({
            url: '/api/cart/add',
            method: 'POST',
            data: sendData
          });
          await this.getCartFromCloud();
        } catch (error) {
          throw new Error('添加购物车失败');
        }
      } else {
        // 未登录：添加到本地缓存
        this.cartList.push({ ...processedCartData, checked: false });
        uni.setStorageSync('cartTemp', this.cartList);
      }
    },

    // 删除购物车商品
    async deleteCart(cartIds, productId, specId) {
      const userStore = useUserStore();
      if (userStore.isLogin) {
        // 已登录：从云端删除
        try {
          // 统一使用 /api/cart/products (DELETE) 接口
          // 如果提供了具体的 productId 和 specId，则只删除该项
          // 如果提供了 cartIds 数组，则批量删除
          let pIds = productId;
          let sIds = specId;

          if (!productId || !specId) {
            // 从 cartList 中找到对应的 productId 和 specId
            const itemsToDelete = this.cartList.filter(item => cartIds.includes(item.id));
            pIds = itemsToDelete.map(item => item.productId).join(',');
            sIds = itemsToDelete.map(item => item.specId).join(',');
          }

          await request({
            url: '/api/cart/products',
            method: 'DELETE',
            params: { 
              productIds: pIds,
              specIds: sIds
            }
          });
          
          await this.getCartFromCloud();
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      } else {
        // 未登录：从本地缓存删除
        this.cartList = this.cartList.filter(item => !cartIds.includes(item.id));
        uni.setStorageSync('cartTemp', this.cartList);
      }
    },

    // 更新商品数量
    async updateQuantity(cartId, quantity, productId, specId) {
      const userStore = useUserStore();
      
      // 更新本地状态（提升体验）
      const index = this.cartList.findIndex(item => item.id === cartId);
      if (index !== -1) {
        this.cartList[index].quantity = quantity;
      }

      if (userStore.isLogin) {
        // 已登录：同步到云端
        try {
          // 统一使用 /api/cart/update (PUT) 接口
          let pId = productId;
          let sId = specId;

          if (!productId || !specId) {
            const item = this.cartList.find(item => item.id === cartId);
            if (item) {
              pId = item.productId;
              sId = item.specId;
            }
          }

          if (pId && sId) {
            await request({
              url: '/api/cart/update',
              method: 'PUT',
              data: {
                cartItems: [
                  { productId: pId, specId: sId, quantity: quantity }
                ]
              }
            });
          }
          // 同步最新状态
          await this.getCartFromCloud();
        } catch (error) {
          uni.showToast({ title: '数量修改失败', icon: 'none' });
        }
      } else {
        // 未登录：保存本地缓存
        uni.setStorageSync('cartTemp', this.cartList);
      }
    },

    // 全选/取消全选
    toggleAllSelect(isChecked) {
      this.cartList = this.cartList.map(item => ({ ...item, checked: isChecked }));
      // 未登录时同步到本地缓存
      const userStore = useUserStore();
      if (!userStore.isLogin) {
        uni.setStorageSync('cartTemp', this.cartList);
      }
    },

    // 同步购物车数据（页面切换时调用）
    syncCart() {
      this.initCart();
    }
  }
});
