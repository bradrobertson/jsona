'use strict';

import {
    IJsonaModel,
    IJsonApiBody,
    IJsonApiData,
    IJsonaRequestedFields,
    IJsonaIncludeTree,
    IJsonaUniqueIncluded
} from '../JsonaInterfaces';

class JsonBuilder {

    protected item: IJsonaModel;
    protected collection: IJsonaModel[];
    protected error: Object;
    protected meta: Object;
    protected requestedIncludesTree: IJsonaIncludeTree;
    protected requestedFields: IJsonaRequestedFields;

    setItem(item: IJsonaModel): void {
        this.item = item;
    }

    setCollection(collection: IJsonaModel[]): void {
        this.collection = collection;
    }

    setError(error: Object): void {
        this.error = error;
    }

    setMeta(meta: Object): void {
        this.meta = meta;
    }

    setRequestedFields(requestedFields: IJsonaRequestedFields) {
        this.requestedFields = requestedFields;
    }

    setRequestedIncludesTree(requestedIncludesTree: IJsonaIncludeTree)
    {
        this.requestedIncludesTree = requestedIncludesTree;
    }

    buildBody(): IJsonApiBody {
        var body: IJsonApiBody = {};
        var meta = {};
        var included: IJsonApiData[] = [];
        var uniqueIncluded: IJsonaUniqueIncluded = {};

        if (!!this.item) {

            body['data'] = this.buildDataByModel(this.item);


            let includedByModel = this.buildIncludedByModel(
                this.item,
                this.requestedIncludesTree
            );
            if (Object.keys(includedByModel).length) {
                (<any>Object).assign(uniqueIncluded, includedByModel);
            }

        } else if (!!this.collection) {
            let collectionLength = this.collection.length;
            let data = [];
            let uniqueIncluded = {};

            for (let i = 0; i <= collectionLength; i++) {
                data.push(
                    this.buildDataByModel(this.collection[i])
                );

                let includedByModel = this.buildIncludedByModel(
                    this.collection[i],
                    this.requestedIncludesTree
                );
                if (Object.keys(includedByModel).length) {
                    (<any>Object).assign(uniqueIncluded, includedByModel);
                }
            }

            body['data'] = data;
        }

        if (Object.keys(uniqueIncluded).length) {
            body['included'] = [];
            for (let k in uniqueIncluded) {
                body['included'].push(uniqueIncluded[k]);
            }
        }

        if (!!this.error) {
            body['error'] = this.error;
        }

        if (!!this.meta) {
            body['meta'] = this.meta;
        }

        return body;
    }

    buildDataByModel(model: IJsonaModel) {
        let data = {
            id: model.getId(),
            type: model.getType(),
            attributes: model.getAttributes(),
        };

        let relationships = this.buildRelationshipsByModel(model);
        if (relationships && Object.keys(relationships).length) {
            data['relationships'] = relationships;
        }

        return data;
    }

    buildRelationshipsByModel(model: IJsonaModel) {
        let relationships = {};
        let relations = model.getRelationships();

        for (let k in relations) {
            let relation = relations[k];

            if (relation instanceof Array) {
                let relationship = [];
                let relationLength = relation.length;

                for (let i = 0; i <= relationLength; i++) {
                    relationship.push({
                        data: {
                            id: relation[i].getId(),
                            type: relation[i].getType()
                        }
                    });
                }

                relationships[k] = relationship;
            } else {
                relationships[k] = {
                    data: {
                        id: relation.getId(),
                        type: relation.getType()
                    }
                };
            }
        }

        return relationships;
    }

    buildIncludedByModel(
        model: IJsonaModel,
        includeTree: IJsonaIncludeTree
    ): IJsonaUniqueIncluded | {} {

        if (!includeTree || !Object.keys(includeTree).length) {
            return {};
        }

        var included = {};
        var modelRelationships = model.getRelationships();
 
        for (let k in includeTree) {
            if (modelRelationships[k]) {
                var relation: IJsonaModel | IJsonaModel[] = modelRelationships[k];

                if (relation instanceof Array) {
                    let relationItems = relation;
                    let relationItemsLength = relationItems.length;

                    for (let i; i <= relationItemsLength; i++) {
                        let relationItem = relationItems[i];

                        let includeKey = relationItem.getType() + relationItem.getId();
                        let includedItem = {};
                        includedItem[includeKey] = this.buildDataByModel(relationItem);
                        (<any>Object).assign(included, includedItem);

                        if (typeof includeTree === 'object') {
                            (<any>Object).assign(
                                included,
                                this.buildIncludedByModel(relationItem, (<IJsonaIncludeTree>includeTree[k]))
                            );
                        }
                    }
                } else {
                    let includeKey = relation.getType() + relation.getId();
                    let includedItem = {};
                    includedItem[includeKey] = this.buildDataByModel(relation);
                    (<any>Object).assign(included, includedItem);

                    if (typeof includeTree === 'object') {
                        (<any>Object).assign(
                            included,
                            this.buildIncludedByModel(relation, (<IJsonaIncludeTree>includeTree[k]))
                        );
                    }
                }
            }
        }

        return included;
    }

}

export default JsonBuilder;