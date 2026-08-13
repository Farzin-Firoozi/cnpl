import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 2 * 60 * 1000,
})

const onRequest = (config: InternalAxiosRequestConfig) => {
  return config
}

const onRequestError = (error: AxiosError): Promise<AxiosError> => {
  return Promise.reject(error)
}

const onResponse = (response: AxiosResponse): AxiosResponse => {
  return response
}

const onResponseError = async (error: AxiosError): Promise<AxiosError> => {
  return Promise.reject(error)
}

function setupInterceptorsTo(axiosInstance: AxiosInstance): AxiosInstance {
  axiosInstance.interceptors.request.use(onRequest, onRequestError)
  axiosInstance.interceptors.response.use(onResponse, onResponseError)
  return axiosInstance
}

const client = setupInterceptorsTo(axiosInstance)

type MutatorConfig = AxiosRequestConfig & { body?: unknown }

export const mutator = <T>(url: string, config?: MutatorConfig): Promise<T> => {
  const { body, ...rest } = config ?? {}

  const promise = client({ url, data: body, ...rest }).then(
    (response) => response.data as T,
  )

  return promise
}

export type ErrorType<Error> = AxiosError<Error>
export type BodyType<BodyData> = BodyData
