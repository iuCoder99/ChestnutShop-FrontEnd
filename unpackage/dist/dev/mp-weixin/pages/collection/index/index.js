"use strict";
const common_vendor = require("../../../common/vendor.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_api = require("../../../utils/api.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const isLoading = common_vendor.ref(false);
    const isManageMode = common_vendor.ref(false);
    const collectionList = common_vendor.ref([]);
    const isEnd = common_vendor.ref(false);
    const sortValue = common_vendor.ref(null);
    const sortId = common_vendor.ref(null);
    const querySize = common_vendor.ref(20);
    const selectedCount = common_vendor.computed(() => {
      return collectionList.value.filter((item) => item.checked).length;
    });
    const isAllSelected = common_vendor.computed(() => {
      return collectionList.value.length > 0 && collectionList.value.every((item) => item.checked);
    });
    const toggleManageMode = () => {
      if (isManageMode.value) {
        exitManageMode();
      } else {
        isManageMode.value = true;
      }
    };
    common_vendor.onNavigationBarButtonTap((e) => {
      if (e.text === "管理") {
        toggleManageMode();
      }
    });
    common_vendor.onLoad(() => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        return;
      }
      refreshList();
    });
    common_vendor.onShow(() => {
      if (userStore.token) {
        if (!isManageMode.value)
          ;
      }
    });
    common_vendor.onReachBottom(() => {
      if (!isEnd.value && !isLoading.value) {
        getCollectionList();
      }
    });
    const refreshList = async () => {
      collectionList.value = [];
      isEnd.value = false;
      sortValue.value = null;
      sortId.value = null;
      await getCollectionList();
    };
    const exitManageMode = () => {
      isManageMode.value = false;
      collectionList.value.forEach((item) => item.checked = false);
    };
    const handleItemClick = (item, index) => {
      if (isManageMode.value) {
        item.checked = !item.checked;
      } else {
        goToProductDetail(item.id);
      }
    };
    const toggleSelectAll = () => {
      const newState = !isAllSelected.value;
      collectionList.value.forEach((item) => item.checked = newState);
    };
    const batchDelete = async () => {
      if (selectedCount.value === 0)
        return;
      const selectedItems = collectionList.value.filter((item) => item.checked);
      const ids = selectedItems.map((item) => item.id);
      common_vendor.index.showModal({
        title: "提示",
        content: `确定要删除选中的 ${selectedCount.value} 个商品吗？`,
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "删除中..." });
            try {
              const res2 = await utils_api.userApi.deleteCollect(ids);
              if (res2.success) {
                common_vendor.index.showToast({ title: "删除成功" });
                collectionList.value = collectionList.value.filter((item) => !item.checked);
                if (collectionList.value.length === 0) {
                  exitManageMode();
                }
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/collection/index/index.vue:215", "批量删除失败:", error);
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const getCollectionList = async () => {
      if (isLoading.value || isEnd.value)
        return;
      isLoading.value = true;
      try {
        const params = {
          sortValue: sortValue.value,
          sortId: sortId.value,
          querySize: querySize.value
        };
        const res = await utils_api.userApi.getCollectList(params);
        if (res.success && res.data) {
          const { list = [], isEnd: endStatus, simpleCursorCommonEntity } = res.data;
          const newList = list.map((item) => ({
            ...item,
            checked: false
          }));
          collectionList.value = [...collectionList.value, ...newList];
          isEnd.value = endStatus;
          if (simpleCursorCommonEntity) {
            sortValue.value = simpleCursorCommonEntity.sortValue;
            sortId.value = simpleCursorCommonEntity.sortId;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/collection/index/index.vue:254", "获取收藏列表失败:", error);
      } finally {
        isLoading.value = false;
      }
    };
    const handleLongPress = (item, index) => {
      common_vendor.index.showActionSheet({
        itemList: ["删除收藏"],
        itemColor: "#FF0000",
        success: (res) => {
          if (res.tapIndex === 0) {
            cancelCollection(item.id, index);
          }
        }
      });
    };
    const cancelCollection = async (productId, index) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要取消收藏该产品吗？",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "处理中..." });
            try {
              const res2 = await utils_api.userApi.deleteCollect(productId);
              if (res2.success) {
                common_vendor.index.showToast({ title: "取消收藏成功" });
                collectionList.value.splice(index, 1);
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/collection/index/index.vue:288", "取消收藏失败:", error);
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const buyNow = (item) => {
      common_vendor.index.navigateTo({
        url: `/pages/order/confirm/confirm?productId=${item.id}&quantity=1`
      });
    };
    const goToProductDetail = (productId) => {
      if (!productId)
        return;
      common_vendor.index.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: collectionList.value.length > 0
      }, collectionList.value.length > 0 ? {
        b: common_vendor.t(collectionList.value.length),
        c: common_vendor.t(isManageMode.value ? "完成" : "管理"),
        d: common_vendor.o(toggleManageMode, "09")
      } : {}, {
        e: collectionList.value.length > 0
      }, collectionList.value.length > 0 ? {
        f: common_vendor.f(collectionList.value, (item, index, i0) => {
          return common_vendor.e(isManageMode.value ? common_vendor.e({
            a: item.checked
          }, item.checked ? {} : {}, {
            b: item.checked ? 1 : ""
          }) : {}, {
            c: item.image || "/static/images/default-category.png",
            d: common_vendor.t(item.name),
            e: item.specText
          }, item.specText ? {
            f: common_vendor.t(item.specText)
          } : {}, {
            g: common_vendor.t((item.price || 0).toFixed(2)),
            h: item.isEnterprisePrice
          }, item.isEnterprisePrice ? {} : {}, !isManageMode.value ? {
            i: common_vendor.o(($event) => buyNow(item), item.id || index),
            j: common_vendor.o(($event) => cancelCollection(item.id, index), item.id || index),
            k: common_vendor.o(() => {
            }, item.id || index)
          } : {}, {
            l: item.id || index,
            m: common_vendor.o(($event) => handleItemClick(item), item.id || index),
            n: common_vendor.o(($event) => handleLongPress(item, index), item.id || index)
          });
        }),
        g: isManageMode.value,
        h: !isManageMode.value
      } : {}, {
        i: isManageMode.value
      }, isManageMode.value ? common_vendor.e({
        j: isAllSelected.value
      }, isAllSelected.value ? {} : {}, {
        k: isAllSelected.value ? 1 : "",
        l: common_vendor.o(toggleSelectAll, "fd"),
        m: common_vendor.o(exitManageMode, "1e"),
        n: common_vendor.t(selectedCount.value),
        o: selectedCount.value === 0 ? 1 : "",
        p: common_vendor.o(batchDelete, "7d")
      }) : !isLoading.value && collectionList.value.length === 0 ? {
        r: common_vendor.o((...args) => _ctx.goToHome && _ctx.goToHome(...args), "0d")
      } : {}, {
        q: !isLoading.value && collectionList.value.length === 0,
        s: isLoading.value
      }, isLoading.value ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a3216c10"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/collection/index/index.js.map
