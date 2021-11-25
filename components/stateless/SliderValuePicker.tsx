import { Box, Flex, Grid, Slider, Text } from '@theme-ui/components'
import BigNumber from 'bignumber.js'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { SxStyleProp } from 'theme-ui'

export interface SliderValuePickerProps {
  sliderKey: string
  leftBoundry: BigNumber
  leftBoundryFormatter: (input: BigNumber) => string
  rightBoundry: BigNumber
  rightBoundryFormatter: (input: BigNumber) => string
  setter: (input: BigNumber) => void
  minBoundry: BigNumber
  maxBoundry: BigNumber
  lastValue: BigNumber
  disabled: boolean
  leftBoundryStyling: SxStyleProp
  rightBoundryStyling: SxStyleProp
}

export function SliderValuePicker(props: SliderValuePickerProps) {
  const { t } = useTranslation()

  const leftLabel = t(`slider.${props.sliderKey}.left-label`)
  const rightLabel = t(`slider.${props.sliderKey}.right-label`)
  const leftFooter = t(`slider.${props.sliderKey}.left-footer`)
  const rightFooter = t(`slider.${props.sliderKey}.right-footer`)
  const introductionHeader = t(`slider.${props.sliderKey}.introduction-header`)
  const introductionContent = t(`slider.${props.sliderKey}.introduction-content`)
  return (
    <Grid gap={2}>
      {introductionHeader && (
        <Text variant="strong" mb={2}>
          {introductionHeader}
        </Text>
      )}
      {introductionContent && (
        <Text variant="paragraph3" mb={2}>
          {introductionContent}
        </Text>
      )}
      <Box>
        <Flex
          sx={{
            variant: 'text.paragraph4',
            justifyContent: 'space-between',
            fontWeight: 'semiBold',
            color: 'text.subtitle',
          }}
        >
          <Grid gap={2}>
            {leftLabel && <Text>{leftLabel}</Text>}
            <Text variant="paragraph1" sx={{ fontWeight: 'semiBold' }}>
              {props.leftBoundryFormatter(props.leftBoundry)}
            </Text>
          </Grid>
          <Grid gap={2}>
            {rightLabel && <Text>{rightLabel}</Text>}
            <Text variant="paragraph1" sx={props.leftBoundryStyling}>
              {props.rightBoundryFormatter(props.rightBoundry)}
            </Text>
          </Grid>
        </Flex>
      </Box>
      <Box my={1}>
        <Slider
          sx={props.rightBoundryStyling}
          disabled={props.disabled}
          step={0.05}
          min={props.minBoundry?.toNumber()}
          max={props.maxBoundry?.toNumber()}
          value={props.lastValue?.toNumber() || props.maxBoundry?.toNumber()}
          onChange={(e) => {
            props.setter(new BigNumber(e.target.value))
          }}
        />
      </Box>
      <Box>
        <Flex
          sx={{
            variant: 'text.paragraph4',
            justifyContent: 'space-between',
            color: 'text.subtitle',
          }}
        >
          {leftFooter && <Text>{leftFooter}</Text>}
          {rightFooter && <Text>{rightFooter}</Text>}
        </Flex>
      </Box>
    </Grid>
  )
}
