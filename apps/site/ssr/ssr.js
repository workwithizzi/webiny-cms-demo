import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import { ApolloProvider } from "react-apollo";
import { StaticRouter } from "react-router-dom";
import ReactDOMServer from "react-dom/server";
import Helmet from "react-helmet";
import { getDataFromTree } from "@apollo/react-ssr";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import { createOmitTypenameLink } from "@webiny/app/graphql";
import injectContent from "./injectContent";
import App from "../src/App";

const createClient = () => {
    return new ApolloClient({
        ssrMode: true,
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createHttpLink({
                uri: process.env.REACT_APP_GRAPHQL_API_URL
            })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    });
};

export const renderer = async url => {
    const apolloClient = createClient();
    const context = {};

    const app = (
        <ApolloProvider client={apolloClient}>
            <StaticRouter
                basename={process.env.PUBLIC_URL === "/" ? null : process.env.PUBLIC_URL}
                location={url}
                context={context}
            >
                <App />
            </StaticRouter>
        </ApolloProvider>
    );

    // Executes all graphql queries for the current state of application
    await getDataFromTree(app);
    const content = ReactDOMServer.renderToStaticMarkup(app);
    const state = apolloClient.extract();
    const helmet = Helmet.renderStatic();
    return { html: injectContent(content, helmet, state), state };
};
