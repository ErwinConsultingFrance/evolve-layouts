/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI:true*/

(function(cwApi) {
	'use strict';

	var LayoutMatrix = function(options, viewSchema) {
		cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema);
		this.drawOneMethod = LayoutMatrix.drawOne.bind(this);
		cwApi.registerLayoutForJSActions(this);
	};

	LayoutMatrix.drawOne = function(output, item, callback, nameOnly) {

		var itemDisplayName, cleanItemName, uid, canDelete, newObject;

		if (!cwApi.isUndefined(item.is_new) && item.is_new) {
			itemDisplayName = item.name;
			newObject = true;
		} else {
			itemDisplayName = this.getDisplayItem(item, nameOnly);
			newObject = false;
		}

		if (!cwApi.isUndefined(item.iProperties)) {
			uid = item.iProperties.uniqueidentifier;
			if (cwApi.isUndefined(uid)) {
				uid = item.iProperties.id;
			}
		} else {
			uid = 0;
		}

		if (!cwApi.isUndefined(item.iObjectAccessRights)) {
			canDelete = item.iObjectAccessRights.CanDeleteIntersection;
		} else {
			canDelete = true;
		}

		cleanItemName = cwApi.cwSearchEngine.removeSearchEngineZone(item.name);

		// output.push("<span", cwLayoutList.addHtmlDataItems(uid, cleanItemName, item.object_id, canDelete, newObject), "class='cw-item  ", this.nodeID, " ", this.nodeID, "-", item.object_id, " ", this.options.NodeCSSClass, "'>", "<span class='", this.nodeID, " ", this.options.NodeCSSClass, "'>");
		output.push("<span class='matrix-item ", this.nodeID, " ", this.options.NodeCSSClass, "'>");
		cwApi.cwEditProperties.outputAssociationDeleteItem(output, item.nodeID);
		output.push(itemDisplayName, " </span>");

		//this.outputChildren(output, item);

		// output.push("</span>");
	};


	LayoutMatrix.prototype.drawAssociations = function(output, associationTitleText, object) {
		/*jslint unparam:true*/
		var i, child, otScriptname;
		var childrenDictionary = {};
		var horizontalLables = [];

		var layoutId = this.options.LayoutID;
		var result = layoutId.split(";");

		var prop4VerticalColumnScriptName = result[0];
		var prop4HorizontalColumnScriptName = result[1];

		if (cwApi.isUndefined(object.associations[this.nodeID])) {
			return;
		}

		if (object.associations[this.nodeID].length > 0) {
			otScriptname = object.associations[this.nodeID][0].objectTypeScriptName; //object.ObjectType;

			var prop4VerticalColumn = cwApi.mm.getProperty(otScriptname, prop4VerticalColumnScriptName);
			var prop4HorizontalColumn = cwApi.mm.getProperty(otScriptname, prop4HorizontalColumnScriptName);

			//properties' labels
			var prop4VerticalColumnLabel = prop4VerticalColumn.name;
			var prop4HorizontalColumnLabel = prop4HorizontalColumn.name;


			//var lookupsV = prop4HorizontalColumn.lookups;
			//properties' lookup values
			prop4VerticalColumn.lookups.sort(function(a, b) {
				return b.abbr - a.abbr;
			});

			prop4HorizontalColumn.lookups.sort(function(a, b) {
				return a.abbr - b.abbr;
			});

			//create dictionary structure
			for (var v = 0; v < prop4VerticalColumn.lookups.length; v++) {
				if (prop4VerticalColumn.lookups[v].name == '__|UndefinedValue|__') {
					continue;
				}
				var rowKey = "r_" + prop4VerticalColumn.lookups[v].abbr;

				if (cwApi.isUndefined(childrenDictionary[rowKey])) {
					childrenDictionary[rowKey] = {};
					childrenDictionary[rowKey]["Label"] = prop4VerticalColumn.lookups[v].name;
				}
				for (var h = 0; h < prop4HorizontalColumn.lookups.length; h++) {
					if (prop4HorizontalColumn.lookups[h].name == '__|UndefinedValue|__') {
						continue;
					}
					var columnKey = "c_" + prop4HorizontalColumn.lookups[h].abbr;

					//var cellKey = verticalColumnAbbrValue + horizontalColumnAbbrValue;
					if (cwApi.isUndefined(childrenDictionary[rowKey][columnKey])) {
						childrenDictionary[rowKey][columnKey] = [];
					}
				}
			}

			for (var h = 0; h < prop4HorizontalColumn.lookups.length; h++) {
				//horizontal labels
				if (prop4HorizontalColumn.lookups[h].name == '__|UndefinedValue|__') {
					continue;
				}
				if (horizontalLables.indexOf(prop4HorizontalColumn.lookups[h].name) === -1) {
					horizontalLables.push(prop4HorizontalColumn.lookups[h].name);
				}
			}

			//console.log("horizontalLables:", horizontalLables);


			output.push("<span class='matrix-title'>", prop4VerticalColumnLabel, "</span>");
			output.push("<table class='cw-matrix cw-visible'>");

			for (i = 0; i < object.associations[this.nodeID].length; i += 1) {
				child = object.associations[this.nodeID][i];

				var prop4VerticalColumnAbbr = prop4VerticalColumnScriptName + "_abbreviation";
				var prop4HorizontalColumnAbbr = prop4HorizontalColumnScriptName + "_abbreviation";


				// console.log("verticalColumnAbbrValue", child.properties[prop4VerticalColumnScriptName]);
				// console.log("horizontalColumnAbbrValue", child.properties[prop4HorizontalColumnScriptName]);
				//properties abbreviation value
				var verticalColumnAbbrValue = child.properties[prop4VerticalColumnAbbr];
				var horizontalColumnAbbrValue = child.properties[prop4HorizontalColumnAbbr];

				// console.log("verticalColumnAbbrValue", verticalColumnAbbrValue);
				// console.log("horizontalColumnAbbrValue", horizontalColumnAbbrValue);
				if (verticalColumnAbbrValue == "") {
					continue;
				}
				if (horizontalColumnAbbrValue == "") {
					continue;
				}

				var rowKey = "r_" + verticalColumnAbbrValue;
				var columnKey = "c_" + horizontalColumnAbbrValue;
				childrenDictionary[rowKey][columnKey].push(child);
			}

			var that = this;
			// console.log("childrenDictionary", childrenDictionary);
			for (var k in childrenDictionary) {
				if (childrenDictionary.hasOwnProperty(k)) {
					// console.log("k", k);
					var childrenInOneRow = childrenDictionary[k];
					output.push("<tr>");
					output.push("<td class='matrix-label-v'>", childrenInOneRow["Label"], "</td>");

					Object.keys(childrenInOneRow).sort().forEach(function(r) {
						if (r === "Label") {
							return;
						}
						var childrenInOneCell = childrenInOneRow[r];
						output.push("<td class='matrix-data ", k + "_" + r, "'>");
						for (i = 0; i < childrenInOneCell.length; i += 1) {
							child = childrenInOneCell[i];
							that.drawOneMethod(output, child);
						}
						output.push("</td>");
					});
					output.push("</tr>");
				}
			}

			output.push("<tr><th></th>");
			for (var j = 0; j < horizontalLables.length; j++) {
				output.push("<td class='matrix-label'>", horizontalLables[j], "</td>");
			}
			output.push("</tr>");
			output.push("<tr class='matrix-title'><td colspan='", horizontalLables.length + 1, "'>", prop4HorizontalColumnLabel, "</td></tr>");
			output.push('</table>');
		}
	};
	cwApi.cwLayouts.LayoutMatrix = LayoutMatrix;
}(cwAPI));