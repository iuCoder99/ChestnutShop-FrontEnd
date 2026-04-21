"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const utils_areaData = require("../../../utils/areaData.js");
const _sfc_main = {
  __name: "edit",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const isEditMode = common_vendor.ref(false);
    const isSubmitting = common_vendor.ref(false);
    const phoneError = common_vendor.ref(false);
    const areaPickerVisible = common_vendor.ref(false);
    const pickerValue = common_vendor.ref([0, 0, 0]);
    const provinceList = common_vendor.ref(utils_areaData.provinceList || []);
    const cityList = common_vendor.ref([]);
    const districtList = common_vendor.ref([]);
    const addressForm = common_vendor.ref({
      id: "",
      // 地址ID（编辑模式）
      receiver: "",
      // 收件人
      phone: "",
      // 手机号
      province: "",
      // 省份
      city: "",
      // 城市
      district: "",
      // 区县
      detailAddress: "",
      // 详细地址
      isDefault: false
      // 是否默认地址
    });
    common_vendor.onLoad((options) => {
      var _a;
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        return;
      }
      const type = options.type || "add";
      isEditMode.value = type === "edit";
      if (isEditMode.value && options.address) {
        try {
          addressForm.value = JSON.parse(decodeURIComponent(options.address));
          initAreaPicker();
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/address/edit/edit.vue:193", "地址数据解析失败:", error);
          common_vendor.index.showToast({ title: "地址数据格式错误", icon: "none" });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        }
      } else {
        const firstProvince = provinceList.value[0];
        cityList.value = (firstProvince == null ? void 0 : firstProvince.cityList) || [];
        districtList.value = ((_a = cityList.value[0]) == null ? void 0 : _a.districtList) || [];
        pickerValue.value = [0, 0, 0];
        addressForm.value = {
          id: "",
          receiver: "",
          phone: "",
          province: "",
          city: "",
          district: "",
          detailAddress: "",
          isDefault: false
        };
      }
    });
    common_vendor.onUnload(() => {
      common_vendor.index.$off("addressEdited");
      common_vendor.index.$off("addressAdded");
    });
    const handleDelete = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要删除该地址吗？",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "删除中" });
            try {
              const res2 = await utils_request.request({
                url: "/api/address/delete",
                method: "DELETE",
                params: { id: addressForm.value.id }
              });
              if (res2.success) {
                common_vendor.index.showToast({ title: "删除成功" });
                common_vendor.index.$emit("addressEdited");
                setTimeout(() => {
                  common_vendor.index.navigateBack();
                }, 1500);
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/address/edit/edit.vue:247", "删除失败:", error);
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const initAreaPicker = () => {
      var _a, _b;
      const pName = addressForm.value.province;
      const cName = addressForm.value.city;
      const dName = addressForm.value.district;
      const pIdx = provinceList.value.findIndex((item) => item.name === pName);
      if (pIdx !== -1) {
        cityList.value = provinceList.value[pIdx].cityList || [];
        const cIdx = cityList.value.findIndex((item) => item.name === cName);
        if (cIdx !== -1) {
          districtList.value = cityList.value[cIdx].districtList || [];
          const dIdx = districtList.value.findIndex((item) => item === dName);
          pickerValue.value = [pIdx, cIdx, dIdx !== -1 ? dIdx : 0];
        } else {
          pickerValue.value = [pIdx, 0, 0];
          districtList.value = ((_a = cityList.value[0]) == null ? void 0 : _a.districtList) || [];
        }
      } else {
        const firstProvince = provinceList.value[0];
        cityList.value = (firstProvince == null ? void 0 : firstProvince.cityList) || [];
        districtList.value = ((_b = cityList.value[0]) == null ? void 0 : _b.districtList) || [];
        pickerValue.value = [0, 0, 0];
      }
    };
    const validatePhone = (e) => {
      const phone = e.detail.value;
      const reg = /^1[3-9]\d{9}$/;
      phoneError.value = phone && !reg.test(phone);
    };
    const showAreaPicker = () => {
      areaPickerVisible.value = true;
    };
    const hideAreaPicker = () => {
      areaPickerVisible.value = false;
    };
    const onPickerChange = (e) => {
      var _a, _b;
      const val = e.detail.value;
      if (val[0] !== pickerValue.value[0]) {
        val[1] = 0;
        val[2] = 0;
        cityList.value = provinceList.value[val[0]].cityList || [];
        districtList.value = ((_a = cityList.value[0]) == null ? void 0 : _a.districtList) || [];
      } else if (val[1] !== pickerValue.value[1]) {
        val[2] = 0;
        districtList.value = ((_b = cityList.value[val[1]]) == null ? void 0 : _b.districtList) || [];
      }
      pickerValue.value = val;
    };
    const confirmArea = () => {
      const [pIdx, cIdx, dIdx] = pickerValue.value;
      const province = provinceList.value[pIdx];
      const city = cityList.value[cIdx];
      const district = districtList.value[dIdx];
      if (province && city && district) {
        addressForm.value.province = province.name;
        addressForm.value.city = city.name;
        addressForm.value.district = district;
        hideAreaPicker();
      }
    };
    const handleDefaultChange = (e) => {
      addressForm.value.isDefault = e.detail.value ? true : false;
    };
    const submitAddress = async () => {
      if (!addressForm.value.receiver) {
        common_vendor.index.showToast({ title: "请输入收件人姓名", icon: "none" });
        return;
      }
      if (!addressForm.value.phone || phoneError.value) {
        common_vendor.index.showToast({ title: "请输入有效的手机号", icon: "none" });
        return;
      }
      if (!addressForm.value.province || !addressForm.value.city || !addressForm.value.district) {
        common_vendor.index.showToast({ title: "请选择完整的所在地区", icon: "none" });
        return;
      }
      if (!addressForm.value.detailAddress) {
        common_vendor.index.showToast({ title: "请输入详细地址", icon: "none" });
        return;
      }
      isSubmitting.value = true;
      try {
        const payload = {
          receiver: addressForm.value.receiver,
          phone: addressForm.value.phone,
          province: addressForm.value.province,
          city: addressForm.value.city,
          district: addressForm.value.district,
          detailAddress: addressForm.value.detailAddress,
          isDefault: !!addressForm.value.isDefault
        };
        let res;
        if (isEditMode.value) {
          payload.id = addressForm.value.id;
          res = await utils_request.request({
            url: "/api/address/update",
            method: "PUT",
            data: payload
          });
        } else {
          res = await utils_request.request({
            url: "/api/address/add",
            method: "POST",
            data: payload
          });
        }
        if (res.success) {
          common_vendor.index.showToast({ title: isEditMode.value ? "地址修改成功" : "地址新增成功" });
          if (isEditMode.value) {
            common_vendor.index.$emit("addressEdited");
          } else {
            common_vendor.index.$emit("addressAdded");
          }
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        } else {
          common_vendor.index.showToast({ title: res.message || (isEditMode.value ? "地址修改失败" : "地址新增失败"), icon: "none" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "网络异常，操作失败", icon: "none" });
      } finally {
        isSubmitting.value = false;
      }
    };
    const navigateBack = () => {
      common_vendor.index.navigateBack();
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0$4,
        b: common_vendor.o(navigateBack, "5f"),
        c: common_vendor.t(isEditMode.value ? "编辑地址" : "新增地址"),
        d: isSubmitting.value ? 1 : "",
        e: common_vendor.o(submitAddress, "3a"),
        f: addressForm.value.receiver,
        g: common_vendor.o(($event) => addressForm.value.receiver = $event.detail.value, "36"),
        h: common_vendor.o([($event) => addressForm.value.phone = $event.detail.value, validatePhone], "62"),
        i: addressForm.value.phone,
        j: phoneError.value
      }, phoneError.value ? {} : {}, {
        k: addressForm.value.province
      }, addressForm.value.province ? {
        l: common_vendor.t(addressForm.value.province),
        m: common_vendor.t(addressForm.value.city),
        n: common_vendor.t(addressForm.value.district)
      } : {}, {
        o: common_assets._imports_1$1,
        p: common_vendor.o(showAreaPicker, "32"),
        q: addressForm.value.detailAddress,
        r: common_vendor.o(($event) => addressForm.value.detailAddress = $event.detail.value, "63"),
        s: !!addressForm.value.isDefault,
        t: common_vendor.o(handleDefaultChange, "6d"),
        v: isEditMode.value
      }, isEditMode.value ? {
        w: common_vendor.o(handleDelete, "c6")
      } : {}, {
        x: areaPickerVisible.value
      }, areaPickerVisible.value ? {
        y: common_vendor.o(hideAreaPicker, "bc"),
        z: common_vendor.o(confirmArea, "f1"),
        A: common_vendor.f(provinceList.value, (province, index, i0) => {
          return {
            a: common_vendor.t(province.name),
            b: index
          };
        }),
        B: common_vendor.f(cityList.value, (city, index, i0) => {
          return {
            a: common_vendor.t(city.name),
            b: index
          };
        }),
        C: common_vendor.f(districtList.value, (district, index, i0) => {
          return {
            a: common_vendor.t(district),
            b: index
          };
        }),
        D: pickerValue.value,
        E: common_vendor.o(onPickerChange, "2b"),
        F: common_vendor.o(() => {
        }, "84"),
        G: common_vendor.o(hideAreaPicker, "f6")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-460af471"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/address/edit/edit.js.map
