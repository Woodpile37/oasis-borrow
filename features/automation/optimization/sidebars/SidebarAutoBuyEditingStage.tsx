import BigNumber from 'bignumber.js'
import { addAutomationBotTrigger } from 'blockchain/calls/automationBot'
import { IlkData } from 'blockchain/ilks'
import { Vault } from 'blockchain/vaults'
import { useAppContext } from 'components/AppContextProvider'
import { MultipleRangeSlider } from 'components/vault/MultipleRangeSlider'
import { SidebarResetButton } from 'components/vault/sidebar/SidebarResetButton'
import { VaultActionInput } from 'components/vault/VaultActionInput'
import { VaultErrors } from 'components/vault/VaultErrors'
import { VaultWarnings } from 'components/vault/VaultWarnings'
import { BuyInfoSection } from 'features/automation/basicBuySell/InfoSections/BuyInfoSection'
import { MaxGasPriceSection } from 'features/automation/basicBuySell/MaxGasPriceSection/MaxGasPriceSection'
import { BasicBSTriggerData } from 'features/automation/common/basicBSTriggerData'
import {
  BASIC_BUY_FORM_CHANGE,
  BasicBSFormChange,
} from 'features/automation/protection/common/UITypes/basicBSFormChange'
import { VaultErrorMessage } from 'features/form/errorMessagesHandler'
import { VaultWarningMessage } from 'features/form/warningMessagesHandler'
import { getVaultChange } from 'features/multiply/manage/pipes/manageMultiplyVaultCalculations'
import { PriceInfo } from 'features/shared/priceInfo'
import { handleNumericInput } from 'helpers/input'
import { LOAN_FEE, OAZO_FEE } from 'helpers/multiply/calculations'
import { useObservable } from 'helpers/observableHook'
import { one, zero } from 'helpers/zero'
import { useTranslation } from 'next-i18next'
import React, { ReactNode, useMemo } from 'react'

interface SidebarAutoBuyEditingStageProps {
  vault: Vault
  ilkData: IlkData
  basicBuyState: BasicBSFormChange
  isEditing: boolean
  autoBuyTriggerData: BasicBSTriggerData
  priceInfo: PriceInfo
  errors: VaultErrorMessage[]
  warnings: VaultWarningMessage[]
  addTriggerGasEstimation: ReactNode
  slippageLimit?: BigNumber
}

export function SidebarAutoBuyEditingStage({
  vault,
  ilkData,
  isEditing,
  basicBuyState,
  autoBuyTriggerData,
  priceInfo,
  errors,
  warnings,
  slippageLimit,
}: SidebarAutoBuyEditingStageProps) {
  const { uiChanges } = useAppContext()
  const { t } = useTranslation()

  // TODO to be updated
  const min = ilkData.liquidationRatio.plus(0.05).times(100).toNumber()

  return (
    <>
      <MultipleRangeSlider
        min={min}
        max={500} // TODO ŁW use meaningful max
        onChange={(value) => {
          uiChanges.publish(BASIC_BUY_FORM_CHANGE, {
            type: 'target-coll-ratio',
            targetCollRatio: new BigNumber(value.value0),
          })
          uiChanges.publish(BASIC_BUY_FORM_CHANGE, {
            type: 'execution-coll-ratio',
            execCollRatio: new BigNumber(value.value1),
          })
        }}
        value={{
          value0: basicBuyState.targetCollRatio.toNumber(),
          value1: basicBuyState.execCollRatio.toNumber(),
        }}
        valueColors={{
          value1: 'onSuccess',
        }}
        leftDescription={t('auto-buy.target-coll-ratio')}
        rightDescription={t('auto-buy.trigger-coll-ratio')}
        minDescription={`(${t('auto-buy.min-ratio')})`}
      />
      <VaultActionInput
        action={t('auto-buy.set-max-buy-price')}
        amount={basicBuyState.maxBuyOrMinSellPrice}
        hasAuxiliary={false}
        hasError={false}
        currencyCode="USD"
        onChange={handleNumericInput((maxBuyOrMinSellPrice) => {
          uiChanges.publish(BASIC_BUY_FORM_CHANGE, {
            type: 'max-buy-or-sell-price',
            maxBuyOrMinSellPrice,
          })
        })}
        onToggle={(toggleStatus) => {
          uiChanges.publish(BASIC_BUY_FORM_CHANGE, {
            type: 'with-threshold',
            withThreshold: toggleStatus,
          })
          uiChanges.publish(BASIC_BUY_FORM_CHANGE, {
            type: 'max-buy-or-sell-price',
            maxBuyOrMinSellPrice: !toggleStatus
              ? undefined
              : autoBuyTriggerData.maxBuyOrMinSellPrice,
          })
        }}
        showToggle={true}
        toggleOnLabel={t('protection.set-no-threshold')}
        toggleOffLabel={t('protection.set-threshold')}
        toggleOffPlaceholder={t('protection.no-threshold')}
        defaultToggle={basicBuyState.withThreshold}
      />
      {isEditing && (
        <>
          <VaultErrors errorMessages={errors} ilkData={ilkData} />
          <VaultWarnings warningMessages={warnings} ilkData={ilkData} />
        </>
      )}

      <SidebarResetButton
        clear={() => {
          uiChanges.publish(BASIC_BUY_FORM_CHANGE, {
            type: 'reset',
            resetData: {
              targetCollRatio: autoBuyTriggerData.targetCollRatio,
              execCollRatio: autoBuyTriggerData.execCollRatio,
              maxBuyOrMinSellPrice: autoBuyTriggerData.maxBuyOrMinSellPrice,
              withThreshold:
                !autoBuyTriggerData.maxBuyOrMinSellPrice.isZero() ||
                autoBuyTriggerData.triggerId.isZero(),
            },
          })
        }}
      />
      <MaxGasPriceSection
        onChange={(maxGasGweiPrice) => {
          uiChanges.publish(BASIC_BUY_FORM_CHANGE, {
            type: 'max-gas-gwei-price',
            maxGasGweiPrice,
          })
        }}
        defaultValue={basicBuyState.maxGasPercentagePrice}
      />
      {isEditing && (
        <AutoBuyInfoSectionControl
          priceInfo={priceInfo}
          basicBuyState={basicBuyState}
          vault={vault}
          addTriggerGasEstimation={addAutomationBotTrigger}
          slippageLimit={slippageLimit}
        />
      )}
    </>
  )
}

interface AutoBuyInfoSectionControlProps {
  priceInfo: PriceInfo
  vault: Vault
  basicBuyState: BasicBSFormChange
  addTriggerGasEstimation: ReactNode
  slippageLimit?: BigNumber
}

function AutoBuyInfoSectionControl({
  priceInfo,
  vault,
  basicBuyState,
  addTriggerGasEstimation,
  slippageLimit,
}: AutoBuyInfoSectionControlProps) {
  const { tokenPriceUSD$ } = useAppContext()
  const _tokenPriceUSD$ = useMemo(() => tokenPriceUSD$([vault.token]), [vault.token])

  const [tokenPriceData] = useObservable(_tokenPriceUSD$)
  const marketPrice = tokenPriceData?.[vault.token] || priceInfo.currentCollateralPrice
  // TODO ŁW uichanges for slippage?
  console.log('slippageLimit SidebarAutoBuyEditingStage')
  console.log(slippageLimit?.toFixed(3))

  const { debtDelta, collateralDelta } = getVaultChange({
    currentCollateralPrice: priceInfo.currentCollateralPrice,
    marketPrice: marketPrice,
    slippage: slippageLimit?.lte(basicBuyState.deviation.div(100))
      ? slippageLimit
      : basicBuyState.deviation.div(100),
    debt: vault.debt,
    lockedCollateral: vault.lockedCollateral,
    requiredCollRatio: basicBuyState.targetCollRatio.div(100),
    depositAmount: zero,
    paybackAmount: zero,
    generateAmount: zero,
    withdrawAmount: zero,
    OF: OAZO_FEE,
    FF: LOAN_FEE,
  })

  return (
    <BuyInfoSection
      token={vault.token}
      colRatioAfterBuy={basicBuyState.targetCollRatio}
      multipleAfterBuy={one.div(basicBuyState.targetCollRatio.div(100).minus(one)).plus(one)}
      execCollRatio={basicBuyState.execCollRatio}
      nextBuyPrice={priceInfo.nextCollateralPrice}
      slippageLimit={basicBuyState.deviation}
      collateralAfterNextBuy={{
        value: vault.lockedCollateral,
        secondaryValue: vault.lockedCollateral.plus(collateralDelta),
      }}
      outstandingDebtAfterNextBuy={{
        value: vault.debt,
        secondaryValue: vault.debt.plus(debtDelta),
      }}
      collateralToBePurchased={collateralDelta.abs()}
      estimatedTransactionCost={addTriggerGasEstimation}
    />
  )
}
