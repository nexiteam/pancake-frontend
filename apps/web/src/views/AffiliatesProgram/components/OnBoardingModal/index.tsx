import { useEffect, useState } from 'react'
import { useMatchBreakpoints, ModalV2, useToast } from '@pancakeswap/uikit'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { useSignMessage } from '@pancakeswap/wagmi'
import { useTranslation } from '@pancakeswap/localization'
import useUserExist from 'views/AffiliatesProgram/hooks/useUserExist'
import { ethers } from 'ethers'
import DesktopView from './DesktopView'
import MobileView from './MobileView'

export enum Views {
  STEP1,
  STEP2,
}

interface UserRegisterFeeResponse {
  error?: string
  status: 'success' | 'error'
}

const OnBoardingModal = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { address, connector } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { isUserExist } = useUserExist()
  const { toastSuccess, toastError } = useToast()
  const { isDesktop } = useMatchBreakpoints()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState(Views.STEP1)

  useEffect(() => {
    const { ref, user, discount } = router.query
    if (!isUserExist && ref && user && discount) {
      setIsOpen(true)
    }
  }, [isUserExist, router])

  const handleStartNow = async () => {
    try {
      setIsLoading(true)
      // BSC wallet sign message only accept string
      const message =
        connector?.id === 'bsc'
          ? ethers.utils.solidityKeccak256(['string'], [router.query.ref])
          : ethers.utils.arrayify(ethers.utils.solidityKeccak256(['string'], [router.query.ref]))
      const signature = await signMessageAsync({ message })
      const response = await fetch('/api/affiliates-program/user-register-fee', {
        method: 'POST',
        body: JSON.stringify({
          user: {
            linkId: router.query.ref,
            address,
            signature,
          },
        }),
      })

      const result: UserRegisterFeeResponse = await response.json()
      if (result.status === 'success') {
        setCurrentView(Views.STEP2)
        toastSuccess(t('Congratulations! You’re all set!'))
      } else {
        toastError(result.error)
      }
    } catch (error) {
      console.error(`Submit Start Now Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ModalV2 isOpen={isOpen} closeOnOverlayClick onDismiss={() => setIsOpen(false)}>
      {isDesktop ? (
        <DesktopView currentView={currentView} isLoading={isLoading} handleStartNow={handleStartNow} />
      ) : (
        <MobileView currentView={currentView} isLoading={isLoading} handleStartNow={handleStartNow} />
      )}
    </ModalV2>
  )
}

export default OnBoardingModal
