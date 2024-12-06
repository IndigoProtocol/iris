import { DatumParameterKey } from './constants';
import { DatumParameters, DefinitionConstr, DefinitionField } from './types';
import _ from 'lodash';
import * as process from 'process';

export class DefinitionBuilder {

    private readonly _definition: DefinitionConstr;

    constructor(definition: DefinitionConstr | Function) {
        this._definition = _.cloneDeepWith(definition, (value: any) => {
            if (value instanceof Function) {
                return value;
            }
        });
    }

    /**
     * Pull parameters of a datum using a definition template.
     */
    public pullParameters(definedDefinition: DefinitionConstr): DatumParameters {
        if (! this._definition) {
            throw new Error(`Definition file must be loaded before pulling parameters`);
        }

        return this.extractParameters(definedDefinition, this._definition);
    }

    /**
     * Recursively pull parameters from datum using definition template.
     */
    private extractParameters(definedDefinition: DefinitionField, templateDefinition: DefinitionField, foundParameters: DatumParameters = {}): DatumParameters {
        if (! templateDefinition || ! definedDefinition) return foundParameters;

        if (templateDefinition instanceof Function) {
            templateDefinition(definedDefinition, foundParameters);

            return foundParameters;
        }

        if (templateDefinition instanceof Array) {
            if (! (definedDefinition instanceof Array)) {
                throw new Error("Template definition does not match with array");
            }
            templateDefinition.map((fieldParameter: DefinitionField, index: number) => {
                return this.extractParameters(definedDefinition[index], fieldParameter, foundParameters);
            }).forEach((parameters: DatumParameters) => {
                foundParameters = {...foundParameters, ...parameters};
            });
        }

        if ('fields' in definedDefinition) {
            if (! ('fields' in templateDefinition)) {
                throw new Error("Template definition does not match with 'fields'");
            }

            if (typeof templateDefinition.constructor !== 'number') {
                foundParameters[templateDefinition.constructor] = definedDefinition.constructor;
            } else if (templateDefinition.constructor !== definedDefinition.constructor) {
                throw new Error("Template definition does not match with constructor value");
            }

            definedDefinition.fields.map((fieldParameter: DefinitionField, index: number) => {
                return this.extractParameters(fieldParameter, templateDefinition.fields[index], foundParameters);
            }).forEach((parameters: DatumParameters) => {
                foundParameters = {...foundParameters, ...parameters};
            });
        }

        if ('int' in definedDefinition) {
            if (templateDefinition instanceof Function) {
                (templateDefinition as Function)(definedDefinition, foundParameters);

                return foundParameters;
            }
            if (! ('int' in templateDefinition)) {
                throw new Error("Template definition does not match with 'int'");
            }

            if (typeof templateDefinition.int !== 'number') {
                foundParameters[templateDefinition.int] = definedDefinition.int;
            }
        }

        if ('bytes' in definedDefinition) {
            if (templateDefinition instanceof Function) {
                (templateDefinition as Function)(definedDefinition, foundParameters);

                return foundParameters;
            }
            if (! ('bytes' in templateDefinition)) {
                throw new Error("Template definition does not match with 'bytes'");
            }

            const datumKeys: string[] = Object.values(DatumParameterKey);

            if (datumKeys.includes(templateDefinition.bytes)) {
                foundParameters[templateDefinition.bytes] = definedDefinition.bytes;
            }
        }

        return foundParameters;
    }

}
