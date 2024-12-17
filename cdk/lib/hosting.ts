import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Certificate, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  Distribution,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { config } from "../../src/config";

const { PROJECT_NAME } = config;

export class Hosting extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let certificate: ICertificate | undefined;
    let domainNames: string[] | undefined;
    const secret = Secret.fromSecretNameV2(this, "Secret", "Books");

    const CERT_ARN = secret
      .secretValueFromJson("CERT_ARN")
      .unsafeUnwrap()
      .toString();
    const DOMAIN = secret
      .secretValueFromJson("DOMAIN")
      .unsafeUnwrap()
      .toString();

    certificate = Certificate.fromCertificateArn(
      this,
      "SSLCertificate",
      CERT_ARN
    );
    domainNames = [DOMAIN];
    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const origin = S3BucketOrigin.withOriginAccessControl(websiteBucket);

    const distribution = new Distribution(this, `WikiDistribution`, {
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress: true,
        origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404/index.html",
          ttl: Duration.minutes(30),
        },
        {
          httpStatus: 500,
          responseHttpStatus: 500,
          responsePagePath: "/500/index.html",
          ttl: Duration.minutes(30),
        },
      ],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
      certificate,
      domainNames,
    });

    new BucketDeployment(this, `${PROJECT_NAME}DeployWebsite`, {
      sources: [Source.asset("../build")],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // This will not synth locally, so it'll be a manual step for now
    // new ARecord(this, "AliasRecord", {
    //   zone: HostedZone.fromLookup(this, "HostedZone", {
    //     domainName: DOMAIN,
    //   }),
    //   target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    //   recordName: DOMAIN,
    // });
  }
}
