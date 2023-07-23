
export function getDiffOfArrays<T>(arrayBefore: Array<T>, arrayAfter: Array<T>): { removed: Array<T>, added: Array<T> } {
    let removed = arrayBefore.filter((item) => { return !arrayAfter.includes(item); });
    let added = arrayAfter.filter((item) => { return !arrayBefore.includes(item); });
    return {
        removed: removed,
        added: added
    };
}