import { Token, TokenType, Lexer } from "./lexer";
import {
  BinaryOpNode,
  NumberNode,
  NameNode,
  AssignmentNode,
  ASTNode,
  IfNode,
  ConditionalNode,
} from "./ast-node";

export class Parser {
  private currentToken!: Token;

  constructor(private readonly lexer: Lexer) {
    this.currentToken = this.lexer.getNextToken();
  }

  private eat(tokenType: TokenType): void {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(
        `Unexpected token: ${this.currentToken.type}, expected: ${tokenType}`
      );
    }
  }

  // Parse condicional
  private conditional(): ASTNode {
    const left = this.expr();
    if (this.currentToken.type === TokenType.EqualsEquals) {
      this.eat(TokenType.EqualsEquals);
      const right = this.expr();
      return new ConditionalNode(left, "==", right);
    }
    return left;
  }

  // Parse declaração IF
  private ifStatement(): ASTNode {
    this.eat(TokenType.If);
    const condition = this.conditional(); // Condição do IF
    this.eat(TokenType.Then);
    const thenBranch = this.statement(); // Bloco THEN

    let elseBranch: ASTNode | null = null;
    if (this.currentToken.type === TokenType.Else) {
      this.eat(TokenType.Else);
      elseBranch = this.statement(); // Bloco ELSE
    }

    // Consumir o `;` opcional após o bloco `if` ou `else`
    if (this.currentToken.type === TokenType.Semicolon) {
      this.eat(TokenType.Semicolon);
    }

    return new IfNode(condition, thenBranch, elseBranch);
  }

  private factor(): ASTNode {
    const token = this.currentToken;
    if (token.type === TokenType.Number) {
      this.eat(TokenType.Number);
      return new NumberNode(token.value);
    } else if (token.type === TokenType.Name) {
      this.eat(TokenType.Name);
      return new NameNode(token.value);
    } else if (token.type === TokenType.LeftParen) {
      this.eat(TokenType.LeftParen);
      const node = this.expr();
      this.eat(TokenType.RightParen);
      return node;
    }
    throw new Error(`Invalid factor: ${token.value}`);
  }

  private term(): ASTNode {
    let node = this.factor();
    while (
      this.currentToken.type === TokenType.Multiply ||
      this.currentToken.type === TokenType.Divide
    ) {
      const token = this.currentToken;
      this.eat(token.type);
      node = new BinaryOpNode(node, token.value, this.factor());
    }
    return node;
  }

  private expr(): ASTNode {
    let node = this.term();
    while (
      this.currentToken.type === TokenType.Plus ||
      this.currentToken.type === TokenType.Minus
    ) {
      const token = this.currentToken;
      this.eat(token.type);
      node = new BinaryOpNode(node, token.value, this.term());
    }
    return node;
  }

  private assignment(): ASTNode {
    const variableToken = this.currentToken;
    this.eat(TokenType.Name);
    this.eat(TokenType.Equals);
    const exprNode = this.expr();
    this.eat(TokenType.Semicolon);
    return new AssignmentNode(new NameNode(variableToken.value), exprNode);
  }

  public statement(): ASTNode {
    if (this.currentToken.type === TokenType.If) {
      return this.ifStatement(); // Parse declaração IF
    } else if (this.currentToken.type === TokenType.Name) {
      const nextToken = this.lexer.lookAhead();
      if (nextToken.type === TokenType.Equals) {
        return this.assignment(); // Parse atribuição
      }
    }
    return this.expr(); // Expressão simples
  }

  public parse(): ASTNode {
    return this.statement();
  }
}
