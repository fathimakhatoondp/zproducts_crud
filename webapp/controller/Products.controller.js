sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("com.dp.project2.controller.Products", {
        onInit() {
            var oUri = "/V2/(S(p0a2x203ign3r3a2il2u1hgq))/OData/OData.svc/";
            this.oModel = new sap.ui.model.odata.ODataModel(oUri, true);
            this.getView().setModel(this.oModel, "oDataModel");
            this.mode = "";
        },
        onPressAdd: function () {
            this.mode = "add";
            this.onPressOpenAddEditFragment();
        },
        onPressEdit: function (oEvent) {
            debugger;
            this.mode = "edit";

            this.onPressOpenAddEditFragment();

            //grab form-fields and set values of selected row in it
            var oSelectedRowContext = oEvent.getSource().getParent().getParent().getBindingContext("oDataModel");
            this.oSelectedRowPath = oSelectedRowContext.getPath();
            var oSelectedRowData = oSelectedRowContext.getObject();

            //setting values to form fields
            sap.ui.getCore().byId("productId").setValue(oSelectedRowData.ID);
            sap.ui.getCore().byId("productNameId").setValue(oSelectedRowData.Name);
            sap.ui.getCore().byId("productDescriptionId").setValue(oSelectedRowData.Description);

            sap.ui.getCore().byId("productId").setEnabled(false);
            sap.ui.getCore().byId("saveButtonId").setEnabled(true);
        },
        getFormValues: function () {
            return {
                id: sap.ui.getCore().byId("productId").getValue().trim(),
                name: sap.ui.getCore().byId("productNameId").getValue().trim(),
                description: sap.ui.getCore().byId("productDescriptionId").getValue().trim()
            }
        },
        onFormValueChange: function () {
            debugger;
            //reads form data
            var oFormValue = this.getFormValues();

            // enable if at least one field is non-empty
            var bEnable = !!(oFormValue.id || oFormValue.name || oFormValue.description);

            if (bEnable === true) {
                sap.ui.getCore().byId("saveButtonId").setEnabled(true);
            } else {
                sap.ui.getCore().byId("saveButtonId").setEnabled(false);
            }

        },
        onPressSave: function () {
            debugger;
            var that = this;

            var oFormValue = this.getFormValues();
            var oPayload = {
                "ID": oFormValue.id,
                "Name": oFormValue.name,
                "Description": oFormValue.description
            }

            //when not using getFormValues(), follow below code
            //grab values from the form
            // var iProductId = sap.ui.getCore().byId("productId").getValue();
            // var iProductName = sap.ui.getCore().byId("productNameId").getValue();
            // var iProductDescription = sap.ui.getCore().byId("productDescriptionId").getValue();
            // var iProduct = sap.ui.getCore().byId("").getValue();
            // //store form data in payload
            // var oPayload = {
            //     "ID": iProductId,
            //     "Name": iProductName,
            //     "Description": iProductDescription
            // }

            //add(create) or edit(update) based on - "this.mode" flag
            if (this.mode === "add") {
                //check for duplicate id before pushing to model
                //for that read call must be made explicitily instead of getData() on model
                this.oModel.read("/Products", {
                    success: function (oData) {
                        var aData = oData.results || [];

                        //now check for duplicates
                        var bIsDuplicate = aData.some(oItem => {
                            //when not using getFormValues()
                            // return oItem.ID === parseInt(iProductId);

                            return oItem.ID === parseInt(oFormValue.id);
                        });

                        //if found
                        if (bIsDuplicate) {
                            //when not using getFormValues()
                            // MessageBox.error("Product with ID " + oFormValue.id, + " already exists!");

                            MessageBox.error("Product with ID " + oFormValue.id + " already exists!");
                        } else {

                            //push payload to model
                            //add mode
                            that.oModel.create("/Products", oPayload, {
                                success: function () {
                                    MessageToast.show("Product added successfully");
                                    that.oAddFragment.close();
                                    that.oAddFragment.destroy();
                                    that.oAddFragment = null;
                                    that.mode = "";
                                },
                                error: function (oError) {
                                    MessageToast.show(oError);
                                }
                            });
                        }
                    },
                    error: function (oError) {
                        MessageToast.show("Failed to read service - " + oError);
                    }
                });
            } else if (this.mode === "edit") {
                //edit mode

                this.oModel.update(this.oSelectedRowPath, oPayload, {
                    success: function () {
                        MessageToast.show("Product editted successfully");
                        that.oAddFragment.close();
                        that.oAddFragment.destroy();
                        that.oAddFragment = null;
                        that.mode = "";
                    },
                    error: function (oError) {
                        MessageToast.show(oError);
                    }
                });
            }
            //close the fragment and destroy irrespective of add/edit mode on SAVE 
        },
        onPressOpenAddEditFragment: function () {
            //opens fragment
            debugger;
            if (!this.oAddFragment) {
                this.oAddFragment = new sap.ui.xmlfragment("com.dp.project2.view.fragments.addFragment", this);
                this.getView().addDependent(this.oAddFragment);
            }
            // reset form and disable Save on open
            sap.ui.getCore().byId("productId").setValue("");
            sap.ui.getCore().byId("productNameId").setValue("");
            sap.ui.getCore().byId("productDescriptionId").setValue("");
            sap.ui.getCore().byId("saveButtonId").setEnabled(false);
            this.oAddFragment.open();
        },

        //closes fragment if fields are empty else gives warning
        onPressCancel: function () {
            this.oAddFragment.close();
            this.oAddFragment.destroy();
            this.oAddFragment = null;
        },

        //closes fragment
        onPressCloseDialog: function () {
            var that = this;
            //check if form has data
            var oFormValue = this.getFormValues();
            var bFormHasData = oFormValue.id !== "" || oFormValue.name !== "" || oFormValue.description !== ""
            //if form has data
            if (bFormHasData) {
                MessageBox.confirm("You have unsaved data! Do you really want to close?", {
                    actions: ["OK", "Cancel"],
                    emphasizedAction: "Cancel",
                    onClose: function (oAction) {
                        if (oAction == "OK") {
                            that.oAddFragment.close();
                            that.oAddFragment.destroy();
                            that.oAddFragment = null;
                            this.mode = "";
                        } else {
                            MessageToast.show("You can continue editing!");
                        }
                    }
                })
            }
            //form has no data - safe to close without any warnings
            else {
                this.oAddFragment.close();
                this.oAddFragment.destroy();
                this.oAddFragment = null;
                this.mode = "";
            }

        },

        //delete from model
        //using oEvent as everyrow has it's own button, if not you can grab using table
        onPressDelete: function (oEvent) {
            debugger;
            var that = this;
            var oSelectedRowPath = oEvent.getSource().getParent().getParent().getBindingContext("oDataModel").getPath();
            MessageBox.confirm("Are you sure you want to delete?", {
                onClose: function (oAction) {
                    if (oAction == "OK") {
                        that.oModel.remove(oSelectedRowPath, {
                            success: function () {
                                MessageToast.show("Product deleted successfully");

                            },
                            error: function (oError) {
                                MessageToast.show(oError);
                            }
                        });
                    }
                }
            });
        },

        //on search
        onSearch: function (oEvent) {
            // var sQuery = oEvent.getParameters("arguments").query;
            var sQuery = oEvent.getParameter("query");
            sQuery = sQuery ? sQuery?.trim().toLowerCase() : "";

            var oTable = this.getView().byId("productsTableId");
            var oTableBindings = oTable.getBinding("items");

            if (sQuery) {
                //creates Filters 
                var oIdFilter = new sap.ui.model.Filter("ID", sap.ui.model.FilterOperator.EQ, sQuery);
                var oNameFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.EQ, sQuery, false);
                //[] - because you are creating filter for multiple columns
                var oFilter = new sap.ui.model.Filter(
                    {
                        filters: [oIdFilter, oNameFilter],
                        and: false
                    }

                    // [oIdFilter, oNameFilter], false
                );
                oTableBindings.filter(oFilter, sap.ui.model.FilterType.Application);
            } else {
                oTableBindings.filter([], sap.ui.model.FilterType.Application);
            }
        },
        onSort: function () {

        },

        onGroup: function () {

        }
    });
});