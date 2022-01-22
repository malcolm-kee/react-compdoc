import { ArrowLeftIcon } from '@heroicons/react/outline';
import { useQuery } from '@showroomjs/bundles/query';
import { Option, SearchDialog, styled } from '@showroomjs/ui';
import * as React from 'react';
import { Link, useLocation, useNavigate } from '../lib/routing';
import { loadCodeAtPath } from '../route-mapping';
import { colorTheme, THEME } from '../theme';
import { GenericLink } from './generic-link';

const navbarOptions = THEME.navbar;

export interface HeaderProps {
  backUrl?: string;
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  function Header(props, forwardedRef) {
    const location = useLocation();

    const { navigate } = useNavigate();

    const [searchValue, setSearchValue] = React.useState('');

    const { data: options, isLoading } = useQuery<Array<Option<string>>>(
      ['search', searchValue],
      () => {
        if (!searchValue) {
          return [];
        }
        return import('../lib/get-search-result').then((m) =>
          m.getSearchResult(searchValue)
        );
      }
    );

    return (
      <HeaderRoot ref={forwardedRef}>
        <HeaderInner>
          <TitleWrapper>
            {props.backUrl && (
              <HeaderLink href={props.backUrl}>
                <ArrowLeftIcon aria-label="Back" width={20} height={20} />
              </HeaderLink>
            )}
            {navbarOptions.logo && <Logo {...navbarOptions.logo} />}
            <Title to="/">
              {THEME.title}{' '}
              {navbarOptions.version && (
                <Version>v{navbarOptions.version}</Version>
              )}
            </Title>
          </TitleWrapper>
          <ItemWrapper>
            {navbarOptions.items &&
              navbarOptions.items.map((item, i) => (
                <HeaderLink href={item.to} key={i}>
                  {item.label}
                </HeaderLink>
              ))}
            <SearchDialog.Root>
              <SearchDialog.Trigger
                autoFocus={
                  !!(
                    location.state &&
                    (location.state as { searchNavigated: boolean })
                      .searchNavigated
                  )
                }
              >
                <SearchText>Search</SearchText>
              </SearchDialog.Trigger>
              <SearchDialog
                options={options || []}
                placeholder="Search docs"
                onSelect={(result) => {
                  if (result) {
                    navigate(result, {
                      state: {
                        searchNavigated: true,
                      },
                    });
                  }
                }}
                onHighlightedItemChange={(item) => loadCodeAtPath(`/${item}`)}
                onInputChange={setSearchValue}
                className={colorTheme}
                isLoading={isLoading}
              />
            </SearchDialog.Root>
          </ItemWrapper>
        </HeaderInner>
      </HeaderRoot>
    );
  }
);

const Logo = styled('img', {
  maxHeight: '40px',
  width: 'auto',
});

const TitleWrapper = styled('div', {
  display: 'flex',
  gap: '$2',
  alignItems: 'center',
});

const SearchText = styled('span', {
  srOnly: true,
  '@md': {
    srOnly: false,
  },
});

const Version = styled('small', {
  fontSize: '$sm',
  lineHeight: '$sm',
});

const ItemWrapper = styled('div', {
  display: 'flex',
  gap: '$4',
  alignItems: 'center',
});

const HeaderRoot = styled('header', {
  position: 'sticky',
  top: 0,
  backgroundColor: '$primary-800',
  color: 'White',
  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 2px 0px',
  zIndex: 20,
});

const HeaderInner = styled('div', {
  px: '$4',
  py: '$2',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  '@md': {
    py: '$3',
  },
});

const HeaderLink = styled(GenericLink, {
  px: '$2',
  '&:focus': {
    outlineColor: '$primary-200',
  },
  display: 'none',
  '@md': {
    display: 'block',
  },
});

const Title = styled(Link, {
  color: 'inherit',
  textDecoration: 'none',
  px: '$2',
  '&:focus': {
    outlineColor: '$primary-200',
  },
  '@md': {
    fontSize: '$xl',
  },
});
