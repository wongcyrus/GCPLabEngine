import { Construct } from "constructs";
import { ProjectIamMember } from "../.gen/providers/google/project-iam-member";
import { CloudFunctionConstruct } from "../components/cloud-function-construct";
import { CloudFunctionDeploymentConstruct } from "../components/cloud-function-deployment-construct";

export interface CourseRegistrationProps {
    readonly cloudFunctionDeploymentConstruct: CloudFunctionDeploymentConstruct;
    readonly suffix: string;
}

export class CourseRegistration extends Construct {
    public registrationUrl!: string;

    constructor(scope: Construct, id: string) {
        super(scope, id);
    }

    private async build(props: CourseRegistrationProps) {
        const cloudFunctionConstruct = await CloudFunctionConstruct.create(this, "cloud-function", {
            functionName: "registration",
            runtime: "nodejs16",
            cloudFunctionDeploymentConstruct: props.cloudFunctionDeploymentConstruct,
            makePublic: true,
            environmentVariables: {
                "SUFFIX": props.suffix,
            }
        });

        new ProjectIamMember(this, "DatastoreProjectIamMember", {
            project: props.cloudFunctionDeploymentConstruct.project,
            role: "roles/datastore.user",
            member: "serviceAccount:" + cloudFunctionConstruct.serviceAccount.email,
        });

        this.registrationUrl = cloudFunctionConstruct.cloudFunction.serviceConfig.uri;
    }

    public static async create(scope: Construct, id: string, props: CourseRegistrationProps) {
        const me = new CourseRegistration(scope, id);
        await me.build(props);
        return me;
    }
}
