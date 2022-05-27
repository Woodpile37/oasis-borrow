import { BigNumber } from 'bignumber.js'
import { cdpManagerIlks, cdpManagerOwner, cdpManagerUrns } from 'blockchain/calls/cdpManager'
import { cdpRegistryCdps, cdpRegistryOwns } from 'blockchain/calls/cdpRegistry'
import { charterNib, charterPeace, charterUline, charterUrnProxy } from 'blockchain/calls/charter'
import { getCdps } from 'blockchain/calls/getCdps'
import { createIlkToToken$ } from 'blockchain/calls/ilkToToken'
import { vatGem, vatIlk, vatUrns } from 'blockchain/calls/vat'
import { createVaultResolver$ } from 'blockchain/calls/vaultResolver'
import { STREAMS as ROOT_STREAMS } from 'blockchain/constants/identifiers'
import { resolveENSName$ } from 'blockchain/ens'
import { createGetRegistryCdps$ } from 'blockchain/getRegistryCdps'
import { createIlkData$, createIlkDataList$, createIlks$ } from 'blockchain/ilks'
import { createInstiVault$, InstiVault } from 'blockchain/instiVault'
import {
  createAccountBalance$,
  createAllowance$,
  createBalance$,
  createCollateralTokens$,
} from 'blockchain/tokens'
import { createStandardCdps$, createVault$, createVaults$, Vault } from 'blockchain/vaults'
import { pluginDevModeHelpers } from 'components/devModeHelpers'
import { createAccountData } from 'features/account/AccountData'
import {
  ADD_FORM_CHANGE,
  AddFormChange,
  AddFormChangeAction,
  formChangeReducer,
} from 'features/automation/protection/common/UITypes/AddFormChange'
import {
  PROTECTION_MODE_CHANGE_SUBJECT,
  ProtectionModeChange,
  ProtectionModeChangeAction,
  protectionModeChangeReducer,
} from 'features/automation/protection/common/UITypes/ProtectionFormModeChange'
import {
  REMOVE_FORM_CHANGE,
  RemoveFormChange,
  RemoveFormChangeAction,
  removeFormReducer,
} from 'features/automation/protection/common/UITypes/RemoveFormChange'
import {
  TAB_CHANGE_SUBJECT,
  TabChange,
  TabChangeAction,
  tabChangeReducer,
} from 'features/automation/protection/common/UITypes/TabChange'
import { createAutomationTriggersData } from 'features/automation/protection/triggers/AutomationTriggersData'
import { createVaultsBanners$ } from 'features/banners/vaultsBanners'
import {
  createManageVault$,
  ManageStandardBorrowVaultState,
} from 'features/borrow/manage/pipes/manageVault'
import { createOpenVault$ } from 'features/borrow/open/pipes/openVault'
import { createCollateralPrices$ } from 'features/collateralPrices/collateralPrices'
import { currentContent } from 'features/content'
import { createOpenGuniVault$ } from 'features/earn/guni/open/pipes/openGuniVault'
import { createExchangeQuote$, ExchangeAction, ExchangeType } from 'features/exchange/exchange'
import { createGeneralManageVault$ } from 'features/generalManageVault/generalManageVault'
import { createIlkDataListWithBalances$ } from 'features/ilks/ilksWithBalances'
import { createManageMultiplyVault$ } from 'features/multiply/manage/pipes/manageMultiplyVault'
import { createOpenMultiplyVault$ } from 'features/multiply/open/pipes/openMultiplyVault'
import { createReclaimCollateral$ } from 'features/reclaimCollateral/reclaimCollateral'
import { redirectState$ } from 'features/router/redirectState'
import { createPriceInfo$ } from 'features/shared/priceInfo'
import { checkVaultTypeUsingApi$, saveVaultUsingApi$ } from 'features/shared/vaultApi'
import {
  checkAcceptanceFromApi$,
  saveAcceptanceFromApi$,
} from 'features/termsOfService/termsAcceptanceApi'
import { createUserSettings$ } from 'features/userSettings/userSettings'
import {
  checkUserSettingsLocalStorage$,
  saveUserSettingsLocalStorage$,
} from 'features/userSettings/userSettingsLocal'
import { createVaultsOverview$ } from 'features/vaultsOverview/vaultsOverview'
import { IAccount } from 'interfaces/blockchain/IAccount'
import { IBlocks } from 'interfaces/blockchain/IBlocks'
import { IContext } from 'interfaces/blockchain/IContext'
import { IProxy } from 'interfaces/blockchain/IProxy'
import { ITransactions } from 'interfaces/blockchain/ITransactions'
import { IWeb3Context } from 'interfaces/blockchain/IWeb3Context'
import { IOracle } from 'interfaces/protocols/IOracle'
import { memoize } from 'lodash'
import { MAKER_STREAMS } from 'protocols/maker/constants/identifiers'
import { combineLatest, Observable, Subject } from 'rxjs'
import { filter, map, shareReplay } from 'rxjs/operators'

import {
  cropperBonusTokenAddress,
  cropperCrops,
  cropperShare,
  cropperStake,
  cropperStock,
  cropperUrnProxy,
} from '../blockchain/calls/cropper'
import { dogIlk } from '../blockchain/calls/dog'
import {
  tokenAllowance,
  tokenBalance,
  tokenBalanceRawForJoin,
  tokenDecimals,
  tokenName,
  tokenSymbol,
} from '../blockchain/calls/erc20'
import { jugIlk } from '../blockchain/calls/jug'
import { crvLdoRewardsEarned } from '../blockchain/calls/lidoCrvRewards'
import { observe } from '../blockchain/calls/observe'
import { CropjoinProxyActionsContractAdapter } from '../blockchain/calls/proxyActions/adapters/CropjoinProxyActionsSmartContractAdapter'
import { proxyActionsAdapterResolver$ } from '../blockchain/calls/proxyActions/proxyActionsAdapterResolver'
import { vaultActionsLogic } from '../blockchain/calls/proxyActions/vaultActionsLogic'
import { spotIlk } from '../blockchain/calls/spot'
import { charterIlks, cropJoinIlks } from '../blockchain/config'
import { containers } from '../config/di'
import { createBonusPipe$ } from '../features/bonus/bonusPipe'
import { createMakerProtocolBonusAdapter } from '../features/bonus/makerProtocolBonusAdapter'
import {
  InstitutionalBorrowManageAdapter,
  ManageInstiVaultState,
} from '../features/borrow/manage/pipes/adapters/institutionalBorrowManageAdapter'
import { StandardBorrowManageAdapter } from '../features/borrow/manage/pipes/adapters/standardBorrowManageAdapter'
import {
  getTotalSupply,
  getUnderlyingBalances,
} from '../features/earn/guni/manage/pipes/guniActionsCalls'
import { createManageGuniVault$ } from '../features/earn/guni/manage/pipes/manageGuniVault'
import {
  getGuniMintAmount,
  getToken1Balance,
} from '../features/earn/guni/open/pipes/guniActionsCalls'
import { VaultType } from '../features/generalManageVault/vaultType'
import { BalanceInfo, createBalanceInfo$ } from '../features/shared/balanceInfo'
import { createCheckOasisCDPType$ } from '../features/shared/checkOasisCDPType'
import { jwtAuthSetupToken$ } from '../features/termsOfService/jwt'
import { createTermsAcceptance$ } from '../features/termsOfService/termsAcceptance'
import { createVaultHistory$ } from '../features/vaultHistory/vaultHistory'
import { bindDependencies } from '../helpers/di/bindDependencies'
import { createProductCardsData$, createProductCardsWithBalance$ } from '../helpers/productCards'
import curry from 'ramda/src/curry'

export type SupportedUIChangeType =
  | AddFormChange
  | RemoveFormChange
  | TabChange
  | ProtectionModeChange

export type LegalUiChanges = {
  AddFormChange: AddFormChangeAction
  RemoveFormChange: RemoveFormChangeAction
  TabChange: TabChangeAction
  ProtectionModeChange: ProtectionModeChangeAction
}

export type UIChanges = {
  subscribe: <T extends SupportedUIChangeType>(sub: string) => Observable<T>
  publish: <K extends LegalUiChanges[keyof LegalUiChanges]>(sub: string, event: K) => void
  lastPayload: <T extends SupportedUIChangeType>(sub: string) => T
  clear: (sub: string) => void
  configureSubject: <
    T extends SupportedUIChangeType,
    K extends LegalUiChanges[keyof LegalUiChanges]
  >(
    subject: string,
    reducer: (prev: T, event: K) => T,
  ) => void
}

export type UIReducer = (prev: any, event: any) => any

export type ReducersMap = {
  [key: string]: UIReducer
}

function createUIChangesSubject(): UIChanges {
  const latest: any = {}

  const reducers: ReducersMap = {} //TODO: Is there a way to strongly type this ?

  interface PublisherRecord {
    subjectName: string
    payload: SupportedUIChangeType
  }
  const commonSubject = new Subject<PublisherRecord>()

  function subscribe<T extends SupportedUIChangeType>(subjectName: string): Observable<T> {
    return commonSubject.pipe(
      filter((x) => x.subjectName === subjectName),
      map((x) => x.payload as T),
      shareReplay(1),
    )
  }

  function publish<K extends LegalUiChanges[keyof LegalUiChanges]>(subjectName: string, event: K) {
    const accumulatedEvent = reducers.hasOwnProperty(subjectName)
      ? reducers[subjectName](lastPayload(subjectName) || {}, event)
      : lastPayload(subjectName)
    latest[subjectName] = accumulatedEvent
    commonSubject.next({
      subjectName,
      payload: accumulatedEvent,
    })
  }

  function lastPayload<T>(subject: string): T {
    const val: T = latest[subject]
    return val
  }

  function clear(subject: string): any {
    delete latest[subject]
  }

  function configureSubject<
    T extends SupportedUIChangeType,
    K extends LegalUiChanges[keyof LegalUiChanges]
  >(subject: string, reducer: (prev: T, event: K) => T): void {
    reducers[subject] = reducer
  }

  return {
    subscribe,
    publish,
    lastPayload,
    clear,
    configureSubject,
  }
}

function initializeUIChanges() {
  const uiChangesSubject = createUIChangesSubject()

  uiChangesSubject.configureSubject(ADD_FORM_CHANGE, formChangeReducer)
  uiChangesSubject.configureSubject(REMOVE_FORM_CHANGE, removeFormReducer)
  uiChangesSubject.configureSubject(TAB_CHANGE_SUBJECT, tabChangeReducer)
  uiChangesSubject.configureSubject(PROTECTION_MODE_CHANGE_SUBJECT, protectionModeChangeReducer)

  return uiChangesSubject
}

function _setupAppContext(
  web3Context: IWeb3Context,
  context: IContext,
  account: IAccount,
  blocks: IBlocks,
  proxy: IProxy,
  transactions: ITransactions,
  oracle: IOracle,
) {
  // Web3 Context
  const web3Context$ = web3Context.get$()
  const web3ContextConnected$ = web3Context.getConnected$()
  const setupWeb3Context$ = web3Context.connect$

  // App Context
  const context$ = context.get$()
  const connectedContext$ = context.getConnected$()

  // Account
  const initializedAccount$ = account.get$()

  // Blocks
  const onEveryBlock$ = blocks.get$()

  // Transactions
  const txHelpers$ = transactions.getHelpers$()
  const transactionManager$ = transactions.getManager$()
  const addGasEstimation$ = transactions.getGasEstimate$

  // DI behind IPositions?? IProtocol?? no...
  const cdpManagerUrns$ = observe(onEveryBlock$, context$, cdpManagerUrns, bigNumberTostring)
  const cdpManagerIlks$ = observe(onEveryBlock$, context$, cdpManagerIlks, bigNumberTostring)
  const cdpManagerOwner$ = observe(onEveryBlock$, context$, cdpManagerOwner, bigNumberTostring)
  const cdpRegistryOwns$ = observe(onEveryBlock$, context$, cdpRegistryOwns)
  const cdpRegistryCdps$ = observe(onEveryBlock$, context$, cdpRegistryCdps)
  const vatIlks$ = observe(onEveryBlock$, context$, vatIlk)
  const vatUrns$ = observe(onEveryBlock$, context$, vatUrns, ilkUrnAddressToString)
  const vatGem$ = observe(onEveryBlock$, context$, vatGem, ilkUrnAddressToString)
  const spotIlks$ = observe(onEveryBlock$, context$, spotIlk)
  const jugIlks$ = observe(onEveryBlock$, context$, jugIlk)
  const dogIlks$ = observe(onEveryBlock$, context$, dogIlk)

  const charterNib$ = observe(onEveryBlock$, context$, charterNib)
  const charterPeace$ = observe(onEveryBlock$, context$, charterPeace)
  const charterUline$ = observe(onEveryBlock$, context$, charterUline)
  const charterUrnProxy$ = observe(onEveryBlock$, context$, charterUrnProxy)

  const cropperUrnProxy$ = observe(onEveryBlock$, context$, cropperUrnProxy)
  const cropperStake$ = observe(onEveryBlock$, context$, cropperStake)
  const cropperShare$ = observe(onEveryBlock$, context$, cropperShare)
  const cropperStock$ = observe(onEveryBlock$, context$, cropperStock)
  const cropperTotal$ = observe(onEveryBlock$, context$, cropperStock)
  const cropperCrops$ = observe(onEveryBlock$, context$, cropperCrops)
  const cropperBonusTokenAddress$ = observe(onEveryBlock$, context$, cropperBonusTokenAddress)

  const unclaimedCrvLdoRewardsForIlk$ = observe(onEveryBlock$, context$, crvLdoRewardsEarned)

  const getCdps$ = observe(onEveryBlock$, context$, getCdps)

  const charter = {
    nib$: (args: { ilk: string; usr: string }) => charterNib$(args),
    peace$: (args: { ilk: string; usr: string }) => charterPeace$(args),
    uline$: (args: { ilk: string; usr: string }) => charterUline$(args),
  }

  const tokenBalance$ = observe(onEveryBlock$, context$, tokenBalance)
  const balance$ = memoize(
    curry(createBalance$)(blocks, context, tokenBalance$),
    (token, address) => `${token}_${address}`,
  )
  const ensName$ = memoize(curry(resolveENSName$)(context), (address) => address)

  const tokenAllowance$ = observe(onEveryBlock$, context$, tokenAllowance)
  const tokenBalanceRawForJoin$ = observe(onEveryBlock$, context$, tokenBalanceRawForJoin)
  const tokenDecimals$ = observe(onEveryBlock$, context$, tokenDecimals)
  const tokenSymbol$ = observe(onEveryBlock$, context$, tokenSymbol)
  const tokenName$ = observe(onEveryBlock$, context$, tokenName)

  const allowance$ = curry(createAllowance$)(context, tokenAllowance$)

  const ilkToToken$ = curry(createIlkToToken$)(context)

  const ilkData$ = memoize(
    curry(createIlkData$)(vatIlks$, spotIlks$, jugIlks$, dogIlks$, ilkToToken$),
  )

  const charterCdps$ = memoize(
    curry(createGetRegistryCdps$)(onEveryBlock$, context$, cdpRegistryCdps$, proxy, charterIlks),
  )
  const cropJoinCdps$ = memoize(
    curry(createGetRegistryCdps$)(onEveryBlock$, context$, cdpRegistryCdps$, proxy, cropJoinIlks),
  )
  const standardCdps$ = memoize(curry(createStandardCdps$)(proxy, getCdps$))

  const urnResolver$ = curry(createVaultResolver$)(
    cdpManagerIlks$,
    cdpManagerUrns$,
    charterUrnProxy$,
    cropperUrnProxy$,
    cdpRegistryOwns$,
    cdpManagerOwner$,
    proxy,
  )

  const bonusAdapter = memoize(
    (cdpId: BigNumber) =>
      createMakerProtocolBonusAdapter(
        urnResolver$,
        unclaimedCrvLdoRewardsForIlk$,
        {
          stake$: cropperStake$,
          share$: cropperShare$,
          bonusTokenAddress$: cropperBonusTokenAddress$,
          stock$: cropperStock$,
          total$: cropperTotal$,
          crops$: cropperCrops$,
        },
        {
          tokenDecimals$,
          tokenSymbol$,
          tokenName$,
          tokenBalanceRawForJoin$,
        },
        context,
        txHelpers$,
        vaultActionsLogic(new CropjoinProxyActionsContractAdapter()),
        proxy,
        cdpId,
      ),
    bigNumberTostring,
  )

  const bonus$ = memoize(
    (cdpId: BigNumber) => createBonusPipe$(bonusAdapter, cdpId),
    bigNumberTostring,
  )

  const vault$ = memoize(
    (id: BigNumber) =>
      createVault$(urnResolver$, vatUrns$, vatGem$, ilkData$, oracle, ilkToToken$, context, id),
    bigNumberTostring,
  )

  const instiVault$ = memoize(
    curry(createInstiVault$)(
      urnResolver$,
      vatUrns$,
      vatGem$,
      ilkData$,
      oracle,
      ilkToToken$,
      context,
      charter,
    ),
  )

  const vaultHistory$ = memoize(curry(createVaultHistory$)(context, blocks, vault$))

  pluginDevModeHelpers(txHelpers$, connectedContext$, proxy)

  const vaults$ = memoize(
    curry(createVaults$)(onEveryBlock$, vault$, context$, [
      charterCdps$,
      cropJoinCdps$,
      standardCdps$,
    ]),
  )

  const ilks$ = createIlks$(context$)

  const collateralTokens$ = createCollateralTokens$(ilks$, ilkToToken$)

  const accountBalances$ = curry(createAccountBalance$)(balance$, collateralTokens$, oracle)

  const ilkDataList$ = createIlkDataList$(ilkData$, ilks$)
  const ilksWithBalance$ = createIlkDataListWithBalances$(context$, ilkDataList$, accountBalances$)

  const priceInfo$ = curry(createPriceInfo$)(oracle)

  // TODO Don't allow undefined args like this
  const balanceInfo$ = curry(createBalanceInfo$)(balance$) as (
    token: string,
    account: string | undefined,
  ) => Observable<BalanceInfo>

  const userSettings$ = createUserSettings$(
    checkUserSettingsLocalStorage$,
    saveUserSettingsLocalStorage$,
  )

  const openVault$ = memoize((ilk: string) =>
    createOpenVault$(
      connectedContext$,
      txHelpers$,
      proxy,
      allowance$,
      priceInfo$,
      balanceInfo$,
      ilks$,
      ilkData$,
      ilkToToken$,
      addGasEstimation$,
      proxyActionsAdapterResolver$,
      ilk,
    ),
  )

  const exchangeQuote$ = memoize(
    (
      token: string,
      slippage: BigNumber,
      amount: BigNumber,
      action: ExchangeAction,
      exchangeType: ExchangeType,
    ) => createExchangeQuote$(context$, undefined, token, slippage, amount, action, exchangeType),
    (token: string, slippage: BigNumber, amount: BigNumber, action: string, exchangeType: string) =>
      `${token}_${slippage.toString()}_${amount.toString()}_${action}_${exchangeType}`,
  )

  const psmExchangeQuote$ = memoize(
    (
      token: string,
      slippage: BigNumber,
      amount: BigNumber,
      action: ExchangeAction,
      exchangeType: ExchangeType,
    ) => createExchangeQuote$(context$, 'PSM', token, slippage, amount, action, exchangeType),
    (token: string, slippage: BigNumber, amount: BigNumber, action: string, exchangeType: string) =>
      `${token}_${slippage.toString()}_${amount.toString()}_${action}_${exchangeType}`,
  )

  const openMultiplyVault$ = memoize((ilk: string) =>
    createOpenMultiplyVault$(
      connectedContext$,
      txHelpers$,
      proxy,
      allowance$,
      priceInfo$,
      balanceInfo$,
      ilks$,
      ilkData$,
      exchangeQuote$,
      addGasEstimation$,
      userSettings$,
      ilk,
    ),
  )

  const token1Balance$ = observe(onEveryBlock$, context$, getToken1Balance)
  const getGuniMintAmount$ = observe(onEveryBlock$, context$, getGuniMintAmount)

  const openGuniVault$ = memoize((ilk: string) =>
    createOpenGuniVault$(
      connectedContext$,
      txHelpers$,
      proxy,
      allowance$,
      priceInfo$,
      balanceInfo$,
      ilks$,
      ilkData$,
      psmExchangeQuote$,
      onEveryBlock$,
      addGasEstimation$,
      ilk,
      token1Balance$,
      getGuniMintAmount$,
      userSettings$,
    ),
  )

  const manageVault$ = memoize(
    (id: BigNumber) =>
      createManageVault$<Vault, ManageStandardBorrowVaultState>(
        context$,
        txHelpers$,
        proxy,
        allowance$,
        priceInfo$,
        balanceInfo$,
        ilkData$,
        vault$,
        saveVaultUsingApi$,
        addGasEstimation$,
        vaultHistory$,
        proxyActionsAdapterResolver$,
        StandardBorrowManageAdapter,
        automationTriggersData$,
        id,
      ),
    bigNumberTostring,
  )

  const manageInstiVault$ = memoize(
    (id: BigNumber) =>
      createManageVault$<InstiVault, ManageInstiVaultState>(
        context$,
        txHelpers$,
        proxy,
        allowance$,
        priceInfo$,
        balanceInfo$,
        ilkData$,
        instiVault$,
        saveVaultUsingApi$,
        addGasEstimation$,
        vaultHistory$,
        proxyActionsAdapterResolver$,
        InstitutionalBorrowManageAdapter,
        automationTriggersData$,
        id,
      ),
    bigNumberTostring,
  )

  const manageMultiplyVault$ = memoize(
    (id: BigNumber) =>
      createManageMultiplyVault$(
        context$,
        txHelpers$,
        proxy,
        allowance$,
        priceInfo$,
        balanceInfo$,
        ilkData$,
        vault$,
        exchangeQuote$,
        addGasEstimation$,
        userSettings$,
        vaultHistory$,
        saveVaultUsingApi$,
        automationTriggersData$,
        id,
      ),
    bigNumberTostring,
  )

  const getGuniPoolBalances$ = observe(onEveryBlock$, context$, getUnderlyingBalances)

  const getTotalSupply$ = observe(onEveryBlock$, context$, getTotalSupply)

  function getProportions$(gUniBalance: BigNumber, token: string) {
    return combineLatest(getGuniPoolBalances$({ token }), getTotalSupply$({ token })).pipe(
      map(([{ amount0, amount1 }, totalSupply]) => {
        return {
          sharedAmount0: amount0.times(gUniBalance).div(totalSupply),
          sharedAmount1: amount1.times(gUniBalance).div(totalSupply),
        }
      }),
    )
  }

  const manageGuniVault$ = memoize(
    (id: BigNumber) =>
      createManageGuniVault$(
        context$,
        txHelpers$,
        proxy,
        allowance$,
        priceInfo$,
        balanceInfo$,
        ilkData$,
        vault$,
        psmExchangeQuote$,
        addGasEstimation$,
        getProportions$,
        vaultHistory$,
        id,
      ),
    bigNumberTostring,
  )

  const checkOasisCDPType$: (id: BigNumber) => Observable<VaultType> = curry(
    createCheckOasisCDPType$,
  )(curry(checkVaultTypeUsingApi$)(context$), cdpManagerIlks$, charterIlks)

  const generalManageVault$ = memoize(
    curry(createGeneralManageVault$)(
      manageInstiVault$,
      manageMultiplyVault$,
      manageGuniVault$,
      manageVault$,
      checkOasisCDPType$,
      vault$,
    ),
    bigNumberTostring,
  )

  const collateralPrices$ = createCollateralPrices$(collateralTokens$, oracle)

  const productCardsData$ = createProductCardsData$(ilkDataList$, priceInfo$)
  const productCardsWithBalance$ = createProductCardsWithBalance$(ilksWithBalance$, priceInfo$)

  const automationTriggersData$ = memoize(
    curry(createAutomationTriggersData)(context$, onEveryBlock$, vault$),
  )

  const vaultsOverview$ = memoize(
    curry(createVaultsOverview$)(vaults$, ilksWithBalance$, automationTriggersData$),
  )

  const termsAcceptance$ = createTermsAcceptance$(
    web3Context$,
    currentContent.tos.version,
    jwtAuthSetupToken$,
    checkAcceptanceFromApi$,
    saveAcceptanceFromApi$,
  )

  const vaultBanners$ = memoize(
    curry(createVaultsBanners$)(context$, priceInfo$, vault$, vaultHistory$),
    bigNumberTostring,
  )

  const reclaimCollateral$ = memoize(
    curry(createReclaimCollateral$)(context$, txHelpers$, proxy),
    bigNumberTostring,
  )
  const accountData$ = createAccountData(web3Context$, balance$, vaults$, ensName$)

  const uiChanges = initializeUIChanges()

  return {
    web3Context$,
    web3ContextConnected$,
    setupWeb3Context$,
    initializedAccount$,
    context$,
    onEveryBlock$,
    txHelpers$,
    transactionManager$,
    proxyAddress$: proxy.getProxy$,
    proxyOwner$: proxy.getProxyOwner$,
    vaults$,
    vault$,
    ilks$,
    openVault$,
    manageVault$,
    manageInstiVault$,
    manageMultiplyVault$,
    manageGuniVault$,
    vaultsOverview$,
    vaultBanners$,
    redirectState$,
    accountBalances$,
    automationTriggersData$,
    accountData$,
    vaultHistory$,
    collateralPrices$,
    termsAcceptance$,
    reclaimCollateral$,
    openMultiplyVault$,
    generalManageVault$,
    userSettings$,
    openGuniVault$,
    ilkDataList$,
    uiChanges,
    connectedContext$,
    productCardsData$,
    productCardsWithBalance$,
    addGasEstimation$,
    instiVault$,
    ilkToToken$,
    bonus$,
  }
}

type TReturnAppContext = ReturnType<typeof _setupAppContext>

export const setupAppContext = bindDependencies<
  [IWeb3Context, IContext, IAccount, IBlocks, IProxy, ITransactions, IOracle],
  TReturnAppContext
>(
  _setupAppContext,
  [
    ROOT_STREAMS.WEB3_CONTEXT,
    ROOT_STREAMS.CONTEXT,
    ROOT_STREAMS.ACCOUNT,
    ROOT_STREAMS.BLOCKS,
    ROOT_STREAMS.PROXY,
    ROOT_STREAMS.TRANSACTIONS,
    MAKER_STREAMS.ORACLE,
  ],
  containers.protocol.getInstance(),
)

export function bigNumberTostring(v: BigNumber): string {
  return v.toString()
}

function ilkUrnAddressToString({ ilk, urnAddress }: { ilk: string; urnAddress: string }): string {
  return `${ilk}-${urnAddress}`
}

export type AppContext = ReturnType<typeof setupAppContext>
