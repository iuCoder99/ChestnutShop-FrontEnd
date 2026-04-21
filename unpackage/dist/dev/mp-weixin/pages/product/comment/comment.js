"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const utils_request = require("../../../utils/request.js");
const utils_api = require("../../../utils/api.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const _sfc_main = {
  __name: "comment",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const statusBarHeight = common_vendor.ref(20);
    const productId = common_vendor.ref("");
    const isLoading = common_vendor.ref(false);
    const isLoadingMore = common_vendor.ref(false);
    const isEnd = common_vendor.ref(false);
    const commentList = common_vendor.ref([]);
    const currentSortType = common_vendor.ref("default");
    const showReplyPopup = common_vendor.ref(false);
    const replyContent = common_vendor.ref("");
    const isAnonymous = common_vendor.ref(false);
    const currentComment = common_vendor.ref(null);
    const parentCommentForReply = common_vendor.ref(null);
    const sortOptions = [
      { label: "全部", value: "default" },
      { label: "好评", value: "isGoodReview" },
      { label: "追评", value: "isAppendComment" }
    ];
    const lastSortValue = common_vendor.ref("");
    const lastSortId = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      productId.value = options.productId;
      const info = common_vendor.index.getSystemInfoSync();
      statusBarHeight.value = info.statusBarHeight || 20;
      loadFirstComments(true);
    });
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const handleSortChange = (type) => {
      if (currentSortType.value === type)
        return;
      currentSortType.value = type;
      loadFirstComments(true);
    };
    const toggleLike = async (comment, isFirst) => {
      common_vendor.index.__f__("log", "at pages/product/comment/comment.vue:241", "[CommentPage] 点赞交互触发:", { id: comment.id, isFirst, currentLiked: comment.isLiked });
      if (!userStore.token) {
        common_vendor.index.__f__("warn", "at pages/product/comment/comment.vue:244", "[CommentPage] 未登录，拦截点赞");
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        }, 1e3);
        return;
      }
      const oldLiked = comment.isLiked;
      const newLiked = !oldLiked;
      comment.isLiked = newLiked;
      if (newLiked) {
        comment.likeCount = (Number(comment.likeCount) || 0) + 1;
      } else {
        comment.likeCount = Math.max(0, (Number(comment.likeCount) || 0) - 1);
      }
      try {
        common_vendor.index.__f__("log", "at pages/product/comment/comment.vue:264", "[CommentPage] 发起点赞请求:", { productCommentId: String(comment.id), isLike: newLiked ? 1 : 0 });
        const res = await utils_api.productApi.likeComment({
          productCommentId: String(comment.id),
          isLike: newLiked ? 1 : 0,
          isFirstComment: isFirst ? 1 : 0
          // 1:是 0:不是
        });
        if (!res.success) {
          throw new Error(res.message || "操作失败");
        }
        common_vendor.index.showToast({ title: newLiked ? "点赞成功" : "取消点赞", icon: "none" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/comment/comment.vue:277", "[CommentPage] 点赞请求异常:", e);
        comment.isLiked = oldLiked;
        if (oldLiked) {
          comment.likeCount = (Number(comment.likeCount) || 0) + 1;
        } else {
          comment.likeCount = Math.max(0, (Number(comment.likeCount) || 0) - 1);
        }
        common_vendor.index.showToast({ title: e.message || "操作失败", icon: "none" });
      }
    };
    const openReplyPopup = (comment, parent = null) => {
      currentComment.value = comment;
      parentCommentForReply.value = parent;
      showReplyPopup.value = true;
    };
    const closeReplyPopup = () => {
      showReplyPopup.value = false;
      replyContent.value = "";
      isAnonymous.value = false;
      currentComment.value = null;
      parentCommentForReply.value = null;
    };
    const submitReply = async () => {
      if (!replyContent.value.trim())
        return;
      if (!userStore.token) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => common_vendor.index.navigateTo({ url: "/pages/main/login/login" }), 1e3);
        return;
      }
      try {
        common_vendor.index.showLoading({ title: "提交中..." });
        const parentId = parentCommentForReply.value ? parentCommentForReply.value.id : currentComment.value.id;
        const specId = parentCommentForReply.value ? parentCommentForReply.value.productSpecId : currentComment.value.productSpecId;
        const res = await utils_request.request({
          url: "/api/user/product/comment/secondComment/save",
          method: "POST",
          data: {
            productId: String(productId.value),
            productSpecId: specId ? String(specId) : null,
            parentId: String(parentId),
            userNickname: isAnonymous.value ? "匿名用户" : userStore.userInfo.nickname || "用户",
            userAvatar: isAnonymous.value ? "/static/images/default-avatar.png" : userStore.userInfo.avatar || "/static/images/default-avatar.png",
            content: replyContent.value,
            replyUserId: currentComment.value.userId ? String(currentComment.value.userId) : null,
            replyUserNickname: currentComment.value.userNickname ? String(currentComment.value.userNickname) : "",
            isAnonymous: isAnonymous.value ? 1 : 0
          }
        });
        if (res.success) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "回复成功", icon: "success" });
          const targetFirstCommentId = parentCommentForReply.value ? parentCommentForReply.value.id : currentComment.value.id;
          closeReplyPopup();
          const firstCommentIndex = commentList.value.findIndex((c) => c.id === targetFirstCommentId);
          if (firstCommentIndex > -1) {
            const comment = commentList.value[firstCommentIndex];
            if (comment.isExpanded) {
              comment.secondComments = [];
              comment.secondEnd = false;
              loadMoreSecond(firstCommentIndex, true);
            } else {
              toggleExpand(firstCommentIndex);
            }
          }
        } else {
          throw new Error(res.message || "提交失败");
        }
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: e.message || "提交失败", icon: "none" });
      }
    };
    const loadFirstComments = async (isRefresh = false) => {
      if (isRefresh) {
        isLoading.value = true;
        lastSortValue.value = "";
        lastSortId.value = "";
        isEnd.value = false;
      } else {
        if (isEnd.value || isLoadingMore.value)
          return;
        isLoadingMore.value = true;
      }
      try {
        const querySize = 20;
        const res = await utils_request.request({
          url: `/api/user/product/comment/firstComment/show`,
          method: "POST",
          params: { productId: String(productId.value) },
          data: {
            sortType: currentSortType.value,
            sortValue: lastSortValue.value,
            sortId: String(lastSortId.value),
            querySize
          }
        });
        if (res.success && res.data) {
          const data = res.data;
          const newList = data.list.map((item) => {
            let parsedImgs = [];
            if (item.imageUrls) {
              if (Array.isArray(item.imageUrls)) {
                parsedImgs = item.imageUrls;
              } else if (typeof item.imageUrls === "string") {
                try {
                  const cleanedStr = item.imageUrls.replace(/`/g, "").trim();
                  parsedImgs = JSON.parse(cleanedStr);
                } catch (e) {
                  parsedImgs = item.imageUrls.split(",").filter(Boolean);
                }
              }
            }
            parsedImgs = parsedImgs.map((url) => {
              if (typeof url === "string") {
                const trimmed = url.trim();
                const match = trimmed.match(/(https?:\/\/[^\s`"']+)/);
                return match ? match[0] : trimmed.replace(/[`\s]/g, "");
              }
              return url;
            }).filter(Boolean);
            return {
              ...item,
              imageUrls: parsedImgs,
              isLiked: !!item.like,
              // 处理点赞状态
              isExpanded: false,
              appendComment: null,
              secondComments: [],
              secondEnd: false,
              secondSortValue: "",
              secondSortId: ""
            };
          });
          if (isRefresh) {
            commentList.value = newList;
          } else {
            commentList.value = [...commentList.value, ...newList];
          }
          if (data.cursorCommonEntity) {
            isEnd.value = data.cursorCommonEntity.isEnd || data.list.length < querySize;
            lastSortValue.value = data.cursorCommonEntity.sortValue || "";
            lastSortId.value = data.cursorCommonEntity.sortId || "";
          } else {
            isEnd.value = data.isEnd || data.list.length < querySize;
            if (data.list.length > 0) {
              const lastItem = data.list[data.list.length - 1];
              lastSortValue.value = lastItem.createTime || "";
              lastSortId.value = lastItem.id || "";
            }
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/comment/comment.vue:452", "加载一级评论失败:", e);
      } finally {
        isLoading.value = false;
        isLoadingMore.value = false;
      }
    };
    const loadMore = () => {
      loadFirstComments(false);
    };
    const toggleExpand = async (index) => {
      const comment = commentList.value[index];
      comment.isExpanded = !comment.isExpanded;
      if (comment.isExpanded) {
        if (!comment.appendComment && comment.isAppendComment === 1) {
          loadAppendComment(index);
        }
        if (comment.secondComments.length === 0 && !comment.secondEnd) {
          loadMoreSecond(index, true);
        }
      }
    };
    const loadAppendComment = async (index) => {
      const comment = commentList.value[index];
      try {
        const res = await utils_request.request({
          url: `/api/user/product/comment/appendComment/show`,
          method: "GET",
          params: {
            firstCommentId: comment.id
          }
        });
        if (res.success && res.data) {
          let parsedImgs = [];
          if (res.data.imageUrls) {
            if (Array.isArray(res.data.imageUrls)) {
              parsedImgs = res.data.imageUrls;
            } else if (typeof res.data.imageUrls === "string") {
              try {
                const cleanedStr = res.data.imageUrls.replace(/`/g, "").trim();
                parsedImgs = JSON.parse(cleanedStr);
              } catch (e) {
                parsedImgs = res.data.imageUrls.split(",").filter(Boolean);
              }
            }
          }
          parsedImgs = parsedImgs.map((url) => {
            if (typeof url === "string") {
              const trimmed = url.trim();
              const match = trimmed.match(/(https?:\/\/[^\s`"']+)/);
              return match ? match[0] : trimmed.replace(/[`\s]/g, "");
            }
            return url;
          }).filter(Boolean);
          comment.appendComment = {
            ...res.data,
            imageUrls: parsedImgs
          };
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/comment/comment.vue:520", "加载追评失败:", e);
      }
    };
    const loadMoreSecond = async (index, isInitial = false) => {
      const comment = commentList.value[index];
      if (comment.secondEnd)
        return;
      const sortValue = isInitial ? "" : comment.secondSortValue;
      const sortId = isInitial ? "" : comment.secondSortId;
      try {
        const querySize = 5;
        const res = await utils_request.request({
          url: `/api/user/product/comment/secondComment/show`,
          method: "POST",
          params: { firstCommentId: String(comment.id) },
          data: {
            sortValue,
            sortId: String(sortId),
            querySize
          }
        });
        if (res.success && res.data) {
          const data = res.data;
          const newList = data.list.map((item) => ({
            ...item,
            isLiked: !!item.like
            // 处理点赞状态
          }));
          comment.secondComments = [...comment.secondComments, ...newList];
          if (data.cursorCommonEntity) {
            comment.secondEnd = data.cursorCommonEntity.isEnd || data.list.length < querySize;
            comment.secondSortValue = data.cursorCommonEntity.sortValue || "";
            comment.secondSortId = data.cursorCommonEntity.sortId || "";
          } else {
            comment.secondEnd = data.isEnd || data.list.length < querySize;
            if (data.list.length > 0) {
              const lastItem = data.list[data.list.length - 1];
              comment.secondSortValue = lastItem.createTime || "";
              comment.secondSortId = lastItem.id || "";
            }
          }
        } else {
          comment.secondEnd = true;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/comment/comment.vue:568", "加载二级评论失败:", e);
      }
    };
    const previewImage = (urls, current) => {
      common_vendor.index.previewImage({
        urls,
        current: urls[current]
      });
    };
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: statusBarHeight.value + "px",
        b: common_assets._imports_0$4,
        c: common_vendor.o(goBack, "6f"),
        d: common_vendor.f(sortOptions, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.label),
            b: item.value,
            c: currentSortType.value === item.value ? 1 : "",
            d: common_vendor.o(($event) => handleSortChange(item.value), item.value)
          };
        }),
        e: statusBarHeight.value + 44 + "px",
        f: commentList.value.length > 0
      }, commentList.value.length > 0 ? common_vendor.e({
        g: common_vendor.f(commentList.value, (comment, index, i0) => {
          return common_vendor.e({
            a: comment.userAvatar || "/static/images/default-avatar.png",
            b: common_vendor.t(comment.userNickname || "匿名用户"),
            c: common_vendor.t(comment.createTimeBusinessText || comment.createTime),
            d: common_vendor.t(comment.isLiked ? "❤️" : "🤍"),
            e: common_vendor.t(comment.likeCount || 0),
            f: comment.isLiked ? 1 : "",
            g: common_vendor.o(($event) => toggleLike(comment, true), comment.id),
            h: common_vendor.o(($event) => openReplyPopup(comment), comment.id),
            i: common_vendor.t(comment.content),
            j: comment.imageUrls && comment.imageUrls.length > 0
          }, comment.imageUrls && comment.imageUrls.length > 0 ? {
            k: common_vendor.f(comment.imageUrls, (img, idx, i1) => {
              return {
                a: idx,
                b: img,
                c: common_vendor.o(($event) => previewImage(comment.imageUrls, idx), idx)
              };
            })
          } : {}, {
            l: common_vendor.t(comment.productSpecText || "默认规格"),
            m: common_vendor.f(5, (n, k1, i1) => {
              return {
                a: n,
                b: n <= comment.rating ? 1 : ""
              };
            }),
            n: comment.isAppendComment === 1
          }, comment.isAppendComment === 1 ? {} : {}, {
            o: common_vendor.t(comment.isExpanded ? "收起" : "查看回复"),
            p: comment.isExpanded ? 1 : "",
            q: common_vendor.o(($event) => toggleExpand(index), comment.id),
            r: comment.isExpanded
          }, comment.isExpanded ? common_vendor.e({
            s: comment.appendComment
          }, comment.appendComment ? common_vendor.e({
            t: common_vendor.t(comment.appendComment.createTimeBusinessText || comment.appendComment.createTime),
            v: common_vendor.t(comment.appendComment.content),
            w: comment.appendComment.imageUrls && comment.appendComment.imageUrls.length > 0
          }, comment.appendComment.imageUrls && comment.appendComment.imageUrls.length > 0 ? {
            x: common_vendor.f(comment.appendComment.imageUrls, (img, idx, i1) => {
              return {
                a: idx,
                b: img,
                c: common_vendor.o(($event) => previewImage(comment.appendComment.imageUrls, idx), idx)
              };
            })
          } : {}) : {}, {
            y: comment.secondComments && comment.secondComments.length > 0
          }, comment.secondComments && comment.secondComments.length > 0 ? common_vendor.e({
            z: common_vendor.f(comment.secondComments, (reply, rIdx, i1) => {
              return common_vendor.e({
                a: reply.userAvatar || "/static/images/default-avatar.png",
                b: common_vendor.t(reply.userNickname),
                c: reply.replyUserNickname
              }, reply.replyUserNickname ? {
                d: common_vendor.t(reply.replyUserNickname)
              } : {}, {
                e: common_vendor.t(reply.createTimeBusinessText || reply.createTime),
                f: common_vendor.t(reply.isLiked ? "❤️" : "🤍"),
                g: common_vendor.t(reply.likeCount || 0),
                h: reply.isLiked ? 1 : "",
                i: common_vendor.o(($event) => toggleLike(reply, false), reply.id),
                j: common_vendor.o(($event) => openReplyPopup(reply, comment), reply.id),
                k: common_vendor.t(reply.content),
                l: reply.id
              });
            }),
            A: !comment.secondEnd
          }, !comment.secondEnd ? {
            B: common_vendor.o(($event) => loadMoreSecond(index), comment.id)
          } : {}) : !comment.appendComment && comment.secondEnd ? {} : {}, {
            C: !comment.appendComment && comment.secondEnd
          }) : {}, {
            D: comment.id
          });
        }),
        h: isLoadingMore.value
      }, isLoadingMore.value ? {} : {}, {
        i: isEnd.value && commentList.value.length > 0
      }, isEnd.value && commentList.value.length > 0 ? {} : {}) : !isLoading.value ? {
        k: common_assets._imports_1
      } : {}, {
        j: !isLoading.value,
        l: common_vendor.o(loadMore, "53"),
        m: statusBarHeight.value + 44 + 50 + "px",
        n: showReplyPopup.value
      }, showReplyPopup.value ? {
        o: common_vendor.t(((_a = currentComment.value) == null ? void 0 : _a.userNickname) || "用户"),
        p: common_vendor.o(closeReplyPopup, "33"),
        q: replyContent.value,
        r: common_vendor.o(($event) => replyContent.value = $event.detail.value, "87"),
        s: isAnonymous.value ? 1 : "",
        t: common_vendor.o(($event) => isAnonymous.value = !isAnonymous.value, "ae"),
        v: !replyContent.value.trim(),
        w: common_vendor.o(submitReply, "68"),
        x: common_vendor.o(() => {
        }, "6b"),
        y: common_vendor.o(closeReplyPopup, "01")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-92f3f5e2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/product/comment/comment.js.map
