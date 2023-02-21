
export enum Methods {
	get = 'GET',
	post = 'POST',
	put = 'PUT',
	delete = 'DELETE',
}

export type IMethod = Methods.get | Methods.post | Methods.put | Methods.delete
 
interface IFetchOptions {
    method?: IMethod
    body?: any
}

export const useFetch = () => {

    const fetchCall = async (
        endpoint: string,
        options?: IFetchOptions

    ) => {
        let data

        await fetch(endpoint, {
            method: options?.method || Methods.get,
            body:  options?.body ? options?.body : null,
        }).then((response) => response.json())
        .then((result) => data = result);
        
        return data
    }

    return {fetchCall}
}