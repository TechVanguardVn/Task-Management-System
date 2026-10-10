import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMeAPI, loginAPI, logoutAllAPI, logoutAPI, registerAPI, verifyEmailAPI, resendOtpAPI, googleLoginAPI } from '@/services/apis/auth.api'
import { QUERY_KEYS } from '@/constants/queryKeys'

export const useGetMeQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.AUTH_ME,
    queryFn: () => getMeAPI(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

export const useLoginMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH_ME })
    },
  })
}

export const useRegisterMutation = () =>
  useMutation({ mutationFn: registerAPI })

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutAPI,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export const useLogoutAllMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutAllAPI,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export const useVerifyEmailMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: verifyEmailAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH_ME })
    },
  })
}

export const useResendOtpMutation = () =>
  useMutation({ mutationFn: resendOtpAPI })

export const useGoogleLoginMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: googleLoginAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH_ME })
    },
  })
}
