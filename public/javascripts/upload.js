
Ext.namespace("gxp.plugins");

gxp.plugins.Username = Ext.extend(gxp.plugins.Tool, {
  loadFileQueryTimout: 300000,
  ptype: "gispro_upload",
  uploadText: locale.upload.uploadText,
  addActions: function() {
    var menu;
    menu = new Ext.Button({
      menuText: this.uploadText,
      iconCls: 'downloadIcon',
      menu: new Ext.menu.Menu({
        listeners: {
          beforeshow: this.setMenu,
          scope: this
        }
      })
    });
    return gxp.plugins.Username.superclass.addActions.apply(this, [menu]);
  },
  menuHandler: function(obj) {
    return this.downloadFormat(obj.fileFormat);
  },
  checkFormats: function(styles) {
	if (!styles) return false;
	var found = false;
	for (var i=0; i<styles.length; i++) {
		// indexOf returns (-1), it doesn't equal false; 0 equals false
		if ((styles[i].name.indexOf('sf')+1)||(styles[i].name.indexOf('raster')+1))
			found = true;
	}
	return !found;
  },
  setMenu: function(menu) {
    var featureManager, fileFormat, _i, _len, _ref, _results;
    featureManager = this.target.tools[this.featureManager];
    menu.removeAll();
	var styles = featureManager.layerRecord.data.styles;
	if (this.checkFormats(styles)) {
		_ref = featureManager.layerRecord.get('fileFormats');
		_results = [];
		if (_ref==null) return _results;
		for (_i = 0, _len = _ref.length; _i < _len; _i++) {
		  fileFormat = _ref[_i];
		  if (fileFormat.indexOf("SHAPE-ZIP")+1) {
			_results.push(menu.addItem({
				text: "SHAPE-ZIP",
				fileFormat: "SHAPE-ZIP",
				handler: this.menuHandler,
				scope: this
			  }));
		  }
		  if (fileFormat.indexOf("json")+1) {
			_results.push(menu.addItem({
				text: "GeoJSON",
				fileFormat: "json",
				handler: this.menuHandler,
				scope: this
			  }));
		  }
		  /*_results.push(menu.addItem({
			text: fileFormat,
			fileFormat: fileFormat,
			handler: this.menuHandler,
			scope: this
		  }));*/
		}
		return _results;
	}
  },
  downloadFormat: function(format) {
    var data, featureManager, filters, getFeatureUrl, getFeatureUrlArr, i, newOptions, props, protocol, testWfsUrl, urlArr;
    featureManager = this.target.tools[this.featureManager];
    filters = [];
    newOptions = {};
    props = ["featureNS", "featureType", "geometryName", "multi", "outputFormat", "params", "schema", "srsName", "url", "version"];
    protocol = featureManager.featureStore.proxy.protocol;
    i = 0;
    while (i < props.length) {
      newOptions[props[i]] = protocol.options[props[i]];
      i++;
    }
    urlArr = this.target.layerSources[featureManager.layerRecord.get("source")].restUrl.split("/");
    urlArr = urlArr.splice(0, urlArr.length - 1);
    urlArr.push("TestWfsPost");
    testWfsUrl = this.target.downloadFilePageUrl;
    getFeatureUrlArr = newOptions.url.split("/");
    getFeatureUrlArr = getFeatureUrlArr.splice(0, getFeatureUrlArr.length - 1);
    getFeatureUrlArr.push("GetFeature");
    getFeatureUrl = getFeatureUrlArr.join("/");
    newOptions.outputFormat = format;
    newOptions.params = {};
    data = OpenLayers.Format.XML.prototype.write.apply(protocol.format, [protocol.format.writeNode("wfs:GetFeature", newOptions)]);
    return this.loadFile(testWfsUrl, {
      body: data,
      url: getFeatureUrl
    },newOptions.featureNS+":"+newOptions.featureType );
  },
  loadFile: function(url, postData, layer) {
    var form, id, iframe, removeElements;
    id = "queryFormIframe"+new Date().getTime();
    form = this.createForm(url, postData, id, document.body);
	iframe = this.createIframe(id, document.body, layer);    
	removeElements = function() {
      document.body.removeChild(iframe);
      return document.body.removeChild(form);
    };
    setTimeout(removeElements, this.loadFileQueryTimout);    
	form.submit();		
	gxp.plugins.Logger.log("Отправлен запрос на скачивание слоя " + layer, gxp.plugins.Logger.prototype.LOG_LEVEL_INFO);	
    form.removeAttribute("id");
    form.removeAttribute("name");
    iframe.removeAttribute("id");
    return iframe.removeAttribute("name");
  },
  createIframe: function(id, root, layer) {
    var el;
    el = document.createElement("iframe");	
    el.setAttribute("id", id);
    el.setAttribute("name", id);
	el.setAttribute("onload", "if (window.frames['id'].document.title == 'Not Found') {gxp.plugins.Logger.log('Ошибка при скачивании слоя layer. Прокси-сервер недоступен', gxp.plugins.Logger.prototype.LOG_LEVEL_NETWORK_LOCAL_ERRORS);}".replace('layer',layer).replace('id',id));	
    if (root != null) root.appendChild(el);
    return el;
  },
  createForm: function(url, postData, target, root) {
    var el, input, k;
    el = document.createElement("form");
    el.setAttribute("method", "post");
    el.setAttribute("target", target);
    el.setAttribute("action", url);	
    for (k in postData) {
      input = document.createElement("input");
      input.setAttribute("id", k);
      input.setAttribute("name", k);
      input.setAttribute("type", "hidden");
      input.setAttribute("value", postData[k]);
      el.appendChild(input);
    }
    if (root) root.appendChild(el);
    return el;
  }
});

Ext.preg(gxp.plugins.Username.prototype.ptype, gxp.plugins.Username);
