export declare type DependenciesField = 'optionalDependencies' | 'dependencies' | 'devDependencies';
export declare const DEPENDENCIES_FIELDS: DependenciesField[];
export interface Registries {
    default: string;
    [scope: string]: string;
}
