var MASvrHelper = (function () {
    function MASvrHelper() {
        this.defaultLinkUrl = "http://localhost:55601/MA";
        this.defaultApiUrl = this.defaultLinkUrl + "/sma/apis/webGraphics/webGraphicsApi.js";
        this.defaultServicesUrl = this.defaultLinkUrl + "/service";

        this.isRegisteredShowHide = false;

        this.apiOpts = {};
    };

    // init web graphics api.
    // parameters:
    //   apiOpts:     the options duing call webGraphicsApi.init(opts)
    //                    Sample:
    //                    {
    //                        success: function() { /* DO action, such as webGraphicsApi.loadMultiple() */ },
    //                        failure: function() { /* DO action if failed, such as alert('failed!') */ },
    //                        linkUrl: 'http://localhost/intouchWeb',                            // optional, if not set, will get from this class
    //                        serviceUrl: 'http://localhost/intouchweb/api/chartServices.ts',    // optional, if not set, will get from this class
    //                        user: 'Guest'                                                      // optional, if not set, will use 'Guest'
    //                        password: ''                                                       // optional, if not set, will use 'Guest'
    //                        screenBelongViewer: false                                          // if set to false, will NOT assign screens under Viewer. If you want to use LoadMultiple API, set this flag as false. By default will be true.
    //                    }
    //   onApiLoaded: the callback function(), will be triggerred after webGraphicsApi loaded, and before calling webGraphicsApi.init()
    MASvrHelper.prototype.init = function (apiOpts, onApiLoaded) {
        this.apiOpts.success = apiOpts != null && apiOpts.success != null ? apiOpts.success : function () { };
        this.apiOpts.failure = apiOpts != null && apiOpts.failure != null ? apiOpts.failure : function () { };
        this.apiOpts.linkUrl = apiOpts != null && apiOpts.linkUrl != null && apiOpts.linkUrl != "" ? apiOpts.linkUrl : this._getLinkUrl();
        this.apiOpts.serviceUrl = apiOpts != null && apiOpts.serviceUrl != null && apiOpts.serviceUrl != "" ? apiOpts.serviceUrl : this._getServicesUrl();
        this.apiOpts.screenBelongViewer = apiOpts != null && apiOpts.screenBelongViewer != null ? apiOpts.screenBelongViewer : true;
        this.apiOpts.enableCache = apiOpts != null && apiOpts.enableCache != null ? apiOpts.enableCache : null;

        if (apiOpts != null && apiOpts.user != null && apiOpts.user != "") {
            this.apiOpts.user = apiOpts.user;
            this.apiOpts.password = apiOpts != null && apiOpts.password != null && apiOpts.password != "" ? apiOpts.password : "";
        }
        else {
            var userInfo = this.getLogonUserInfo();
            this.apiOpts.user = userInfo && userInfo.user != null && userInfo.user != "" ? userInfo.user : "Guest";
            this.apiOpts.password = userInfo && userInfo.password != null && userInfo.password != "" ? userInfo.password : "";
        }

        // Loading web graphics api. After api loaded, will 
        this._getWebGraphicsApi(onApiLoaded);
    };

    // Register onShow and onHide callback for caching support
    // By default, internal handler will be registered, will automatically handle all screens' show and hide.
    // Also, the additional onShow and onHide will be triggerred if parameters has been set.
    MASvrHelper.prototype.regOnShowHideHandler = function (additionalOnShowCallback, additionalOnHideCallback, onRenderingDone) {
        if (this.isRegisteredShowHide) return;

        var proxy = window.cwidget != null && window.cwidget._proxy != null ? window.cwidget._proxy : null;
        var self = this;

        if (proxy == null) {
            window.setTimeout(function () {
                self.regOnShowHideHandler(additionalOnShowCallback, additionalOnHideCallback, onRenderingDone);
            }, 50);
            return;
        }

        this.isRegisteredShowHide = true;

        var viewerFromDom = null;

        var getViewer = function () {
            if (viewerFromDom != null) return viewerFromDom;
            viewerFromDom = window.dijit && window.dijit.byId ? window.dijit.byId("_x_viewer_Viewer") : null;
            return viewerFromDom;
        }

        var onShow = function () {
            if (!self._isHide) return; // if not hide, will NOT trigger callback.
            var viewer = getViewer();

            if (viewer != null) {
                window.requestAnimationFrame(function () {
                    viewer._showAllHiddenScreens(onRenderingDone);
                    if (additionalOnShowCallback)
                        additionalOnShowCallback();
                });
            }
            else if (viewer == null && additionalOnShowCallback)
                additionalOnShowCallback();
        };

        var onHide = function () {
            self._isHide = true;
            var viewer = getViewer();

            if (viewer != null)
                viewer._hideAllScreens();

            if (additionalOnHideCallback)
                additionalOnHideCallback();
        };

        proxy.addOnShow(onShow);
        proxy.addOnHide(onHide);
    };

    MASvrHelper.prototype._getWebGraphicsApi = function (onApiLoaded) {
        var self = this;
        var isHandled = false;
        var onerror = function () {
            // load failed, should be the server not started or still starting.
            if (isHandled) return;
            window.setTimeout(self._getWebGraphicsApi(onApiLoaded), 500);
            isHandled = true;
        };

        var apiUrl = this._getApiUrl();
        if (apiUrl == null || apiUrl == "") {
            onerror();
            return;
        }

        var s = document.createElement('script');
        s.src = apiUrl;
        try {
            document.body.appendChild(s);
        }
        catch (e) {
            onerror();
        }

        s.onerror = function () {
            document.body.removeChild(s);
            onerror();
        };

        s.onload = function () {
            if (typeof window.webGraphicsApi == "object") {
                if (onApiLoaded)
                    onApiLoaded();

                // update api options in case the url has been set via embedded browser
                self.apiOpts.linkUrl = self._getLinkUrl();
                self.apiOpts.serviceUrl = self._getServicesUrl();
                window.webGraphicsApi.init(self.apiOpts);
            }
            else
                onerror();
        };
    };

    MASvrHelper.prototype._getWidgetProxy = function () {
        if (window.SmaCustomWidget && window.SmaCustomWidget.proxy)
            return window.SmaCustomWidget.proxy;

        return null;
    };

    MASvrHelper.prototype._getWidgetHost = function () {
        var proxy = this._getWidgetProxy();
        if (!proxy || !proxy.host) return null;

        return proxy.host;
    };

    MASvrHelper.prototype._getServicesUrl = function () {
        // get from options first. This could be set via Init(apiOpts)
        if (this.apiOpts != null && this.apiOpts.serviceUrl != null && this.apiOpts.serviceUrl != "")
            return this.apiOpts.serviceUrl;

        // get from local variables. This could be set via embedded browser scripting
        if (window.SmaCustomWidget != null && window.SmaCustomWidget.MASvrHelperParams != null && window.SmaCustomWidget.MASvrHelperParams.servicesUrl != null && window.SmaCustomWidget.MASvrHelperParams.servicesUrl != "")
            return window.SmaCustomWidget.MASvrHelperParams.servicesUrl;

        // get from widget proxy. This will be set via MobileAccess core component at client side
        var host = this._getWidgetHost();
        if (host != null && host.win != null) {
            var win = host.win;
            var url = typeof (win.webGraphicsApi) === 'object' ? win.webGraphicsApi.service_url : (win.sma != null && win.sma.configSettings != null ? win.sma.configSettings.servicesUrl : null);
            if (url != null && url != "")
                return url;

            if (win && win != window && win.SmaCustomWidget != null && win.SmaCustomWidget.MASvrHelper != null && win.SmaCustomWidget.MASvrHelper._getServicesUrl != null) {
                // container is custom widget, and contains MA server helper
                url = win.SmaCustomWidget.MASvrHelper._getServicesUrl();

                if (url != null && url != "")
                    return url;
            }
        }

        return this.defaultServicesUrl;
    };

    MASvrHelper.prototype._getLinkUrl = function () {
        // get from options first. This could be set via Init(apiOpts)
        if (this.apiOpts != null && this.apiOpts.linkUrl != null && this.apiOpts.linkUrl != "")
            return this.apiOpts.linkUrl;

        // get from local variables. This could be set via embedded browser scripting
        if (window.SmaCustomWidget != null && window.SmaCustomWidget.MASvrHelperParams != null && window.SmaCustomWidget.MASvrHelperParams.linkUrl != null && window.SmaCustomWidget.MASvrHelperParams.linkUrl != "")
            return window.SmaCustomWidget.MASvrHelperParams.linkUrl;

        var url = this._getLinkUrlFromContainerApi();
        if (url != null && url != "")
            return url;

        return this.defaultLinkUrl;
    };

    MASvrHelper.prototype._getApiUrl = function () {
        // get from local variables. This could be set via embedded browser scripting
        if (window.SmaCustomWidget != null && window.SmaCustomWidget.MASvrHelperParams != null && window.SmaCustomWidget.MASvrHelperParams.apiUrl != null && window.SmaCustomWidget.MASvrHelperParams.apiUrl != "")
            return window.SmaCustomWidget.MASvrHelperParams.apiUrl;

        var linkUrl = this._getLinkUrlFromContainerApi();
        if (linkUrl != null && linkUrl != "") {
            return linkUrl + "/sma/apis/webGraphics/webGraphicsApi.js"
        }

        return this.defaultApiUrl;
    };

    MASvrHelper.prototype._getLinkUrlFromContainerApi = function () {
        // get from widget proxy. This will be set via MobileAccess core component at client side
        var host = this._getWidgetHost();
        if (host != null && host.win != null) {
            var win = host.win;
            var url = typeof (win.webGraphicsApi) === 'object' ? win.webGraphicsApi._link_url : null;
            if (url != null && url != "")
                return url;

            if (win && win != window && win.SmaCustomWidget != null && win.SmaCustomWidget.MASvrHelper != null && win.SmaCustomWidget.MASvrHelper._getLinkUrlFromContainerApi != null) {
                // container is custom widget, and contains MA server helper
                url = win.SmaCustomWidget.MASvrHelper._getLinkUrlFromContainerApi();
            } else {
                url = typeof (win.dojoConfig) === 'object' ? win.dojoConfig.baseUrl : null;
            }

            if (url != null && url != "")
                return url;
        }

        return null;
    };

    MASvrHelper.prototype.getLogonUserInfo = function () {
        if (this.apiOpts != null && this.apiOpts.user != null && this.apiOpts.user != "")
            return {
                user: this.apiOpts.user,
                password: this.apiOpts.password,
                token: this.apiOpts.token
            };

        // get from widget proxy. This will be set via MobileAccess core component at client side
        var userName = null;
        var password = null;
        var token = null;
        var host = this._getWidgetHost();
        if (host != null && host.win != null) {
            var win = host.win;
            if (win && win.sma && win.sma.temp && ((win.sma.temp.userName && win.sma.temp.userName != "") || (win.sma.temp.token && win.sma.temp.token != "")))
            {
                userName = win.sma.temp.userName;
                token = win.sma.temp.token;
            }
            else {
                userName = typeof (win.webGraphicsApi) === 'object' ? win.webGraphicsApi._userName : null;
            }

            if ((userName != null && userName != "") || (token != null && token != "")) {
                return {
                    user: userName,
                    password: password,
                    token: token
                };
            }

            if (win && win != window && win.SmaCustomWidget != null && win.SmaCustomWidget.MASvrHelper != null && win.SmaCustomWidget.MASvrHelper.getLogonUserInfo != null) {
                // container is custom widget, and contains MA server helper
                return win.SmaCustomWidget.MASvrHelper.getLogonUserInfo();
            }
        }

        return {
            user: null,
            password: null,
            token: null
        };
    };

    return MASvrHelper;
})();

if (typeof (window.SmaCustomWidget) === 'undefined') {
    /**
     * The SmaCustomWidget is the namespace used to encapsulate all the functionalities provided and required
     * to implement custom widgets.
     * @namespace SmaCustomWidget
     */
    window.SmaCustomWidget = {};
}

window.SmaCustomWidget.MASvrHelper = window.SmaCustomWidget.MASvrHelper || new MASvrHelper();

window.SmaCustomWidget.MASvrHelperParams = window.SmaCustomWidget.MASvrHelperParams || { apiUrl: null, servicesUrl: null, linkUrl: null };