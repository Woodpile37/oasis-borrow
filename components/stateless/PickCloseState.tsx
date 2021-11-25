import { Grid } from '@theme-ui/components'
import { CloseVaultCard } from 'components/vault/CloseVaultCard'
import { FixedSizeArray } from 'helpers/types'
import { useState } from 'react'
import React from 'react'

export interface PickCloseStateProps {
  collateralTokenSymbol: string
  collateralTokenIconCircle: string
  optionNames: FixedSizeArray<string, 2>
  onclickHandler: (optionName: string) => void
  isCollateralActive: boolean
}

export function PickCloseState(props: PickCloseStateProps) {
  const [isActive, setIsActive] = useState(props.isCollateralActive)

  console.log("PickCloseState isCollateralActive", isActive);

  const OnClickHandler = (op: string) => {
    setIsActive(op === props.optionNames[0])
    console.log("PickCloseState OnClickHandler isActive=", op === props.optionNames[0]);
    props.onclickHandler(op)
  }

  return (
    <Grid columns={2}>
      <CloseVaultCard
        text={`Close to ${props.collateralTokenSymbol}`}
        icon={props.collateralTokenIconCircle}
        onClick={OnClickHandler}
        isActive={isActive}
        optionName={props.optionNames[0]}
      />
      <CloseVaultCard
        text="Close to DAI"
        icon="dai_circle_color"
        onClick={OnClickHandler}
        isActive={!isActive}
        optionName={props.optionNames[1]}
      />
    </Grid>
  )
}
