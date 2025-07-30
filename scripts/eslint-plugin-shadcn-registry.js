/**
 * ESLint plugin to prevent shadcn CLI transformation issues in registry components
 * 
 * This plugin enforces double quotes and warns about patterns that break during
 * shadcn CLI transformation when components are installed.
 */

module.exports = {
  meta: {
    name: "eslint-plugin-shadcn-registry",
    version: "1.0.0",
  },
  rules: {
    "no-single-quotes": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow single quotes in registry components to prevent shadcn CLI transformation issues",
          category: "Possible Errors",
          recommended: true,
        },
        fixable: "code",
        messages: {
          avoidSingleQuotes: "Use double quotes instead of single quotes in registry components. Single quotes will be transformed incorrectly by shadcn CLI during installation.",
        },
        schema: [],
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === "string" &&
              node.raw &&
              node.raw.startsWith("'") &&
              node.raw.endsWith("'")
            ) {
              context.report({
                node,
                messageId: "avoidSingleQuotes",
                fix(fixer) {
                  // Replace single quotes with double quotes, escaping any double quotes inside
                  const newValue = `"${node.value.replace(/"/g, '\\"')}"`;
                  return fixer.replaceText(node, newValue);
                },
              });
            }
          },
        };
      },
    },
    "warn-typeof-comparisons": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Warn about typeof comparisons that may break during shadcn transformation",
          category: "Best Practices",
          recommended: true,
        },
        messages: {
          typeofWarning: "typeof comparisons must use double quotes to prevent shadcn CLI transformation issues",
        },
        schema: [],
      },
      create(context) {
        return {
          BinaryExpression(node) {
            if (
              node.left.type === "UnaryExpression" &&
              node.left.operator === "typeof" &&
              node.right.type === "Literal" &&
              typeof node.right.value === "string"
            ) {
              context.report({
                node: node.right,
                messageId: "typeofWarning",
              });
            }
          },
        };
      },
    },
  },
};