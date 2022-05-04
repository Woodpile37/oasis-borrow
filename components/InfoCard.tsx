import { Icon } from '@makerdao/dai-ui-icons'
import React from 'react'
import { Box, Card, Heading, SxStyleProp, Text } from 'theme-ui'

import { staticFilesRuntimeUrl } from '../helpers/staticPaths'
import { WithChildren } from '../helpers/types'
import { AppLink } from './Links'

function CardContent({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
} & WithChildren) {
  return (
    <Box sx={{ position: 'relative', zIndex: 2 }}>
      <Heading sx={{ my: 2, fontWeight: 'bold', color: 'primary' }}>{title}</Heading>
      <Text sx={{ mb: 3, color: 'text.subtitle', minHeight: '3em', maxWidth: ['unset', '320px'] }}>
        {subtitle}
      </Text>
      {children}
    </Box>
  )
}

function CardWrapper({
  backgroundImage,
  backgroundGradient,
  sx,
  children,
}: {
  backgroundImage: string
  backgroundGradient: string
  sx?: SxStyleProp
} & WithChildren) {
  return (
    <Card
      sx={{
        borderRadius: 'large',
        border: 'none',
        backgroundImage: `url(${staticFilesRuntimeUrl(backgroundImage)}), ${backgroundGradient}`,
        backgroundPosition: 'bottom 0px right 0px',
        backgroundRepeat: 'no-repeat',
        backgroundSize: ['70%, cover', '220px, cover'],
        minHeight: ['414px', 'unset'],
        ...sx,
      }}
    >
      {children}
    </Card>
  )
}

type InfoCardProps = {
  title: string
  subtitle: string
  links: Array<LinkHref | LinkOnClick>
  backgroundImage: string
  backgroundGradient: string
  sx?: SxStyleProp
}

type LinkHref = { href: string; text: string; onClick?: () => void }

type LinkOnClick = { onClick: () => void; text: string }

function isHref(link: LinkHref | LinkOnClick): link is LinkHref {
  return (link as LinkHref).href !== undefined
}

function isOnClick(link: LinkHref | LinkOnClick): link is LinkHref {
  return (link as LinkOnClick).onClick !== undefined
}

function getLinkActionProps(
  link: LinkHref | LinkOnClick,
): { href: string } | { onClick: (event: any) => void } {
  if (isHref(link)) {
    return { href: link.href }
  } else {
    return {
      onClick: (event: any) => {
        event.preventDefault()
        link.onClick()
      },
    }
  }
}

export function InfoCard(props: InfoCardProps) {
  if (props.links.length === 1) {
    return (
      <CardWrapper {...props} sx={{ ...props.sx, p: 0 }}>
        <AppLink
          href="#"
          variant="unStyled"
          sx={{
            display: 'block',
            p: 4,
            cursor: 'pointer',
            height: '100%',
            '&:hover svg': {
              transform: 'translateX(8px)',
            },
          }}
          {...getLinkActionProps(props.links[0])}
        >
          <CardContent title={props.title} subtitle={props.subtitle}>
            <Box
              sx={{
                pb: 3,
                fontSize: 3,
                color: 'primary',
                fontWeight: 'semiBold',
              }}
            >
              {props.links[0].text}
              <Icon
                name="arrow_right"
                size="15px"
                sx={{ position: 'relative', left: '6px', transition: '0.2s' }}
              />
            </Box>
          </CardContent>
        </AppLink>
      </CardWrapper>
    )
  } else {
    return (
      <CardWrapper {...props} sx={{ ...props.sx, p: 4 }}>
        <CardContent title={props.title} subtitle={props.subtitle}>
          {props.links.map((link) => (
            <Box sx={{ pb: 3 }} key={link.text}>
              <AppLink
                href="#"
                sx={{
                  fontSize: 3,
                  color: 'primary',
                  '&:hover svg': {
                    transform: 'translateX(8px)',
                  },
                }}
                {...getLinkActionProps(link)}
              >
                {link.text}
                <Icon
                  name="arrow_right"
                  size="15px"
                  sx={{ position: 'relative', left: '6px', transition: '0.2s' }}
                />
              </AppLink>
            </Box>
          ))}
        </CardContent>
      </CardWrapper>
    )
  }
}
