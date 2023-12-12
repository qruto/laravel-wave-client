import { prepareHeaders } from '../src/util/request';

test('correctly prepears X-CSRF-TOKEN auth header', () => {
    expect(prepareHeaders({
        namespace: 'namespace',
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN': 'token',
            },
        },
    })).toEqual({
        'X-CSRF-TOKEN': 'token',
    });
});

test('correctly prepears X-CSRF-TOKEN header with `csrfToken` option', () => {
    expect(prepareHeaders({
        namespace: 'namespace',
        authEndpoint: '/broadcasting/auth',
        csrfToken: 'token-direct',
        auth: {
            headers: {
                'X-CSRF-TOKEN': 'token',
            },
        },
    })).toEqual({
        'X-CSRF-TOKEN': 'token-direct',
    });
});
