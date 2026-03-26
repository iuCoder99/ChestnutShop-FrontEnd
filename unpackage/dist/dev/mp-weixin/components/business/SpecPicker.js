"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "SpecPicker",
  props: {
    specList: {
      type: Array,
      required: true,
      default: () => []
    },
    // 选中的规格ID数组
    selectedIds: {
      type: Array,
      default: () => []
    }
  },
  emits: ["specChange"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const selectedSpec = common_vendor.ref({});
    const emit = __emit;
    common_vendor.watch(() => props.selectedIds, (newIds) => {
      if (newIds && newIds.length > 0) {
        newIds.forEach((id) => {
          props.specList.forEach((group, index) => {
            if (group.specItems.some((item) => item.id === id)) {
              selectedSpec.value[index] = id;
            }
          });
        });
      }
    }, { immediate: true });
    const handleSpecClick = (groupIndex, specItem) => {
      if (specItem.stock <= 0)
        return;
      selectedSpec.value[groupIndex] = specItem.id;
      checkAllSpecSelected();
    };
    const checkAllSpecSelected = () => {
      const specCount = props.specList.length;
      const selectedCount = Object.keys(selectedSpec.value).length;
      if (specCount > 0 && selectedCount === specCount) {
        const selectedSpecIds = Object.values(selectedSpec.value);
        emit("specChange", selectedSpecIds);
      }
    };
    common_vendor.watch(() => props.specList, () => {
      selectedSpec.value = {};
    }, { deep: true });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !__props.specList || __props.specList.length === 0
      }, !__props.specList || __props.specList.length === 0 ? {} : {
        b: common_vendor.f(__props.specList, (specGroup, groupIndex, i0) => {
          return {
            a: common_vendor.t(specGroup.specName),
            b: common_vendor.f(specGroup.specItems, (specItem, itemIndex, i1) => {
              return common_vendor.e({
                a: common_vendor.t(specItem.specValue),
                b: specItem.stock > 0 && specItem.stock < 10
              }, specItem.stock > 0 && specItem.stock < 10 ? {
                c: common_vendor.t(specItem.stock)
              } : {}, {
                d: specItem.stock <= 0
              }, specItem.stock <= 0 ? {} : {}, {
                e: itemIndex,
                f: common_vendor.n(selectedSpec.value[groupIndex] === specItem.id ? "spec-item-active" : ""),
                g: common_vendor.n(specItem.stock <= 0 ? "spec-item-disabled" : ""),
                h: common_vendor.o(($event) => handleSpecClick(groupIndex, specItem), itemIndex),
                i: specItem.stock <= 0
              });
            }),
            c: groupIndex
          };
        })
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3fbf4a04"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/business/SpecPicker.js.map
